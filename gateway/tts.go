package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"strings"
)

func handleTTS(w http.ResponseWriter, r *http.Request) {
	writeCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}
	if ttsVendor != "elevenlabs" || ttsKey == "" || ttsVoice == "" {
		http.Error(w, `{"error":"tts not configured"}`, http.StatusServiceUnavailable)
		return
	}

	var body struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || strings.TrimSpace(body.Text) == "" {
		http.Error(w, `{"error":"text required"}`, http.StatusBadRequest)
		return
	}
	if len(body.Text) > 2000 {
		body.Text = body.Text[:2000]
	}

	payload, err := json.Marshal(map[string]any{
		"text":     body.Text,
		"model_id": getenv("TTS_MODEL_ID", "eleven_flash_v2_5"),
	})
	if err != nil {
		http.Error(w, `{"error":"encode failed"}`, http.StatusInternalServerError)
		return
	}

	url := "https://api.elevenlabs.io/v1/text-to-speech/" + ttsVoice + "?output_format=mp3_44100_64"
	req, err := http.NewRequestWithContext(r.Context(), http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		http.Error(w, `{"error":"request build failed"}`, http.StatusInternalServerError)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("xi-api-key", ttsKey)

	resp, err := httpClient.Do(req)
	if err != nil {
		http.Error(w, `{"error":"tts upstream unreachable"}`, http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		raw, _ := io.ReadAll(resp.Body)
		http.Error(w, `{"error":"tts upstream: `+truncate(string(raw), 200)+`"}`, http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "audio/mpeg")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusOK)
	_, _ = io.Copy(w, resp.Body)
}
