package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type subscriber chan []byte

var (
	subsMu sync.RWMutex
	subs   = map[subscriber]bool{}
)

func writeCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func broadcast(event string, payload map[string]any) {
	msg, err := json.Marshal(map[string]any{
		"event": event,
		"data":  payload,
		"ts":    time.Now().UnixMilli(),
	})
	if err != nil {
		return
	}
	subsMu.RLock()
	defer subsMu.RUnlock()
	for s := range subs {
		select {
		case s <- msg:
		default:
		}
	}
}

func handleEvents(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}
	writeCORS(w)
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	ch := make(subscriber, 16)
	subsMu.Lock()
	subs[ch] = true
	subsMu.Unlock()

	defer func() {
		subsMu.Lock()
		delete(subs, ch)
		subsMu.Unlock()
	}()

	heartbeat := time.NewTicker(15 * time.Second)
	defer heartbeat.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case msg := <-ch:
			fmt.Fprintf(w, "data: %s\n\n", msg)
			flusher.Flush()
		case <-heartbeat.C:
			fmt.Fprint(w, ": ping\n\n")
			flusher.Flush()
		}
	}
}
