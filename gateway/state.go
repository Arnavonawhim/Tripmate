package main

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"
)

type sessionState struct {
	Lat      float64               `json:"lat"`
	Lng      float64               `json:"lng"`
	Heading  float64               `json:"heading"`
	Scene    string                `json:"scene"`
	SceneAt  time.Time             `json:"scene_at"`
	Language string                `json:"language"`
	Places   map[string][2]float64 `json:"places"`
}

var (
	stateMu sync.RWMutex
	state   = &sessionState{Language: "en-US", Places: map[string][2]float64{}}
)

const frameMaxAge = 12 * time.Second

var (
	frameMu   sync.RWMutex
	lastFrame []byte
	frameType string
	frameAt   time.Time
)

func storeFrame(b []byte, contentType string) {
	frameMu.Lock()
	defer frameMu.Unlock()
	lastFrame = b
	frameType = contentType
	frameAt = time.Now()
}

func loadFrame() ([]byte, string) {
	frameMu.RLock()
	defer frameMu.RUnlock()
	if frameAt.IsZero() || time.Since(frameAt) > frameMaxAge {
		return nil, ""
	}
	return lastFrame, frameType}

func frameAge() time.Duration {
	frameMu.RLock()
	defer frameMu.RUnlock()
	if frameAt.IsZero() {
		return -1
	}
	return time.Since(frameAt)}

func updateState(f func(s *sessionState)) {
	stateMu.Lock()
	defer stateMu.Unlock()
	f(state)
}

func snapshotState() sessionState {
	stateMu.RLock()
	defer stateMu.RUnlock()
	cp := *state
	cp.Places = map[string][2]float64{}
	for k, v := range state.Places {
		cp.Places[k] = v
	}
	return cp}

func keysOf(m map[string][2]float64) string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return strings.Join(out, ", ")}


func handleContext(w http.ResponseWriter, r *http.Request) {
	writeCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	var body struct {
		Lat      *float64 `json:"lat"`
		Lng      *float64 `json:"lng"`
		Heading  *float64 `json:"heading"`
		Scene    *string  `json:"scene"`
		Language *string  `json:"language"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "bad json: "+err.Error(), http.StatusBadRequest)
		return
	}
	updateState(func(s *sessionState) {
		if body.Lat != nil {
			s.Lat = *body.Lat
		}
		if body.Lng != nil {
			s.Lng = *body.Lng
		}
		if body.Heading != nil {
			s.Heading = *body.Heading
		}
		if body.Scene != nil {
			s.Scene = *body.Scene
			s.SceneAt = time.Now()
		}
		if body.Language != nil {
			s.Language = *body.Language
		}
	})
	writeJSON(w, http.StatusOK, snapshotState())
}

func handleFrame(w http.ResponseWriter, r *http.Request) {
	writeCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if err := r.ParseMultipartForm(12 << 20); err != nil {
		http.Error(w, "bad multipart: "+err.Error(), http.StatusBadRequest)
		return
	}
	file, header, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "missing image field: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()
	data, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	ct := header.Header.Get("Content-Type")
	if ct == "" {
		ct = "image/jpeg"
	}
	storeFrame(data, ct)
	writeJSON(w, http.StatusOK, map[string]any{"stored_bytes": len(data)})
}
