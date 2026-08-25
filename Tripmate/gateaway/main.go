package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type serviceHealth struct {
	Service string `json:"service"`
	OK      bool   `json:"ok"`
	Detail  string `json:"detail,omitempty"`
}

func checkHealth(name, base string, ch chan<- serviceHealth) {
	resp, err := httpClient.Get(base + "/health")
	if err != nil {
		ch <- serviceHealth{Service: name, OK: false, Detail: err.Error()}
		return
	}
	defer resp.Body.Close()
	ch <- serviceHealth{Service: name, OK: resp.StatusCode == http.StatusOK}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	targets := map[string]string{"router": routerURL, "vision": visionURL}
	ch := make(chan serviceHealth, len(targets))
	for name, base := range targets {
		go checkHealth(name, base, ch) // fan out
	}
	results := make([]serviceHealth, 0, len(targets))
	allOK := true
	for range targets {
		h := <-ch
		if !h.OK {
			allOK = false
		}
		results = append(results, h)
	}
	w.Header().Set("Content-Type", "application/json")
	if !allOK {
		w.WriteHeader(http.StatusServiceUnavailable)
	}
	_ = json.NewEncoder(w).Encode(map[string]any{"ok": allOK, "services": results})
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/ask", func(w http.ResponseWriter, r *http.Request) {
		forward(w, r, routerURL, "/ask")
	})
	mux.HandleFunc("/scene", func(w http.ResponseWriter, r *http.Request) {
		forward(w, r, visionURL, "/scene")
	})
	addr := ":" + gatewayPort
	log.Printf("gateway on %s (router=%s, vision=%s)", addr, routerURL, visionURL)
	log.Fatal(http.ListenAndServe(addr, mux))
}