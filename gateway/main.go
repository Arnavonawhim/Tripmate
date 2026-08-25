package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"
)

type serviceHealth struct {
	Name    string `json:"name"`
	OK      bool   `json:"ok"`
	Status  int    `json:"status"`
	Latency int64  `json:"latency_ms"`
	Error   string `json:"error,omitempty"`
}

func checkService(name, base string, out chan<- serviceHealth, wg *sync.WaitGroup) {
	defer wg.Done()
	start := time.Now()
	resp, err := httpClient.Get(strings.TrimSuffix(base, "/") + "/health")
	if err != nil {
		out <- serviceHealth{Name: name, OK: false, Latency: time.Since(start).Milliseconds(), Error: err.Error()}
		return
	}
	defer resp.Body.Close()
	out <- serviceHealth{
		Name:    name,
		OK:      resp.StatusCode < 300,
		Status:  resp.StatusCode,
		Latency: time.Since(start).Milliseconds(),
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	writeCORS(w)
	targets := map[string]string{"router": routerURL, "vision": visionURL}

	out := make(chan serviceHealth, len(targets))
	var wg sync.WaitGroup
	for name, base := range targets {
		wg.Add(1)
		go checkService(name, base, out, &wg)
	}
	wg.Wait()
	close(out)

	services := map[string]serviceHealth{}
	allOK := true
	for h := range out {
		services[h.Name] = h
		if !h.OK {
			allOK = false
		}
	}

	frame, _ := loadFrame()
	code := http.StatusOK
	if !allOK {
		code = http.StatusServiceUnavailable
	}
	writeJSON(w, code, map[string]any{
		"gateway":        "ok",
		"services":       services,
		"has_frame":      len(frame) > 0,
		"agora_ready":    agoraAppID != "" && publicGatewayURL != "",
		"tool_llm_ready": toolLLMKey != "",
	})
}

func handleAsk(w http.ResponseWriter, r *http.Request) {
	forward(w, r, routerURL, "/ask")
}

func handleStream(w http.ResponseWriter, r *http.Request) {
	forward(w, r, routerURL, "/stream")
}

func handleScene(w http.ResponseWriter, r *http.Request) {
	forward(w, r, visionURL, "/scene")
}

func handleRoot(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"service": "trip-mate gateway",
		"status":  "running",
		"routes": []string{
			"GET /health",
			"POST /ask",
			"POST /stream",
			"POST /scene",
			"POST /v1/chat/completions",
			"POST /context",
			"POST /frame",
			"GET /events",
			"POST /agent/start",
			"POST /agent/stop",
			"GET /debug/state",
		},
	})
}

func handleDebugState(w http.ResponseWriter, r *http.Request) {
	writeCORS(w)
	frame, ct := loadFrame()
	s := snapshotState()
	writeJSON(w, http.StatusOK, map[string]any{
		"state":       s,
		"frame_bytes": len(frame),
		"frame_type":  ct,
		"subscribers": len(subs),
	})
}

func handleDebugTool(w http.ResponseWriter, r *http.Request) {
	writeCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	var body struct {
		Name string          `json:"name"`
		Args json.RawMessage `json:"args"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "bad json: "+err.Error(), http.StatusBadRequest)
		return
	}
	args := string(body.Args)
	if args == "" {
		args = "{}"
	}
	result := executeTool(body.Name, args)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(result))
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/", handleRoot)
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/ask", handleAsk)
	mux.HandleFunc("/stream", handleStream)
	mux.HandleFunc("/scene", handleScene)
	mux.HandleFunc("/v1/chat/completions", handleChatCompletions)
	mux.HandleFunc("/context", handleContext)
	mux.HandleFunc("/frame", handleFrame)
	mux.HandleFunc("/events", handleEvents)
	mux.HandleFunc("/agent/start", handleAgentStart)
	mux.HandleFunc("/agent/stop", handleAgentStop)
	mux.HandleFunc("/debug/state", handleDebugState)
	mux.HandleFunc("/debug/tool", handleDebugTool)
	mux.HandleFunc("/tts", handleTTS)
	mux.HandleFunc("/rtc-token", handleRTCToken)

	srv := &http.Server{
		Addr:              ":" + gatewayPort,
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf("gateway listening on :%s router=%s vision=%s", gatewayPort, routerURL, visionURL)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
