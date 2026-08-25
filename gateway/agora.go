package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

func agoraBasicAuth() string {
	return "Basic " + base64.StdEncoding.EncodeToString([]byte(agoraCustomerID+":"+agoraCustomerSec))
}

func ttsConfig() map[string]any {
	switch strings.ToLower(ttsVendor) {
	case "elevenlabs":
		return map[string]any{
			"vendor": "elevenlabs",
			"params": map[string]any{
				"key":      ttsKey,
				"model_id": getenv("TTS_MODEL_ID", "eleven_flash_v2_5"),
				"voice_id": ttsVoice,
			},
		}
	case "sarvam":
		return map[string]any{
			"vendor": "sarvam",
			"params": map[string]any{
				"key":             ttsKey,
				"target_language": getenv("TTS_TARGET_LANGUAGE", "hi-IN"),
				"speaker":         getenv("TTS_SPEAKER", "anushka"),
				"model":           getenv("TTS_MODEL_ID", "bulbul:v2"),
			},
		}
	default:
		return map[string]any{
			"vendor": ttsVendor,
			"params": map[string]any{"key": ttsKey, "voice_id": ttsVoice},
		}
	}
}

func agoraJoinPayload(channel, token, agentName string) map[string]any {
	return map[string]any{
		"name": agentName,
		"properties": map[string]any{
			"channel":           channel,
			"token":             token,
			"agent_rtc_uid":     agoraAgentUID,
			"remote_rtc_uids":   []string{"*"},
			"enable_string_uid": false,
			"idle_timeout":      120,
			"advanced_features": map[string]any{
				"enable_aivad": true,
				"enable_rtm":   true,
			},
			"asr": map[string]any{
				"language": asrLanguage,
			},
			"llm": map[string]any{
				"url":              strings.TrimSuffix(publicGatewayURL, "/") + "/v1/chat/completions",
				"api_key":          gatewayAPIKey,
				"params":           map[string]any{"model": toolLLMModel},
				"max_history":      24,
				"greeting_message": getenv("GREETING", "Hey! I am your AR guide. Point your camera at anything and ask me about it."),
				"failure_message":  "Give me one moment.",
			},
			"tts": ttsConfig(),
		},
	}
}

func agoraCall(method, path string, payload any) (int, []byte, error) {
	var body io.Reader
	if payload != nil {
		b, err := json.Marshal(payload)
		if err != nil {
			return 0, nil, err
		}
		body = bytes.NewReader(b)
	}

	endpoint := fmt.Sprintf("%s/%s%s", strings.TrimSuffix(agoraConvoAIBase, "/"), agoraAppID, path)
	req, err := http.NewRequest(method, endpoint, body)
	if err != nil {
		return 0, nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", agoraBasicAuth())

	resp, err := httpClient.Do(req)
	if err != nil {
		return 0, nil, err
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, raw, nil
}

func handleAgentStart(w http.ResponseWriter, r *http.Request) {
	writeCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if agoraAppID == "" || agoraCustomerID == "" || agoraCustomerSec == "" {
		http.Error(w, `{"error":"agora credentials missing"}`, http.StatusPreconditionFailed)
		return
	}
	if publicGatewayURL == "" {
		http.Error(w, `{"error":"PUBLIC_GATEWAY_URL is not set, agora cannot reach the custom llm"}`, http.StatusPreconditionFailed)
		return
	}

	var body struct {
		Channel  string `json:"channel"`
		Token    string `json:"token"`
		Language string `json:"language"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	if body.Channel == "" {
		http.Error(w, `{"error":"channel is required"}`, http.StatusBadRequest)
		return
	}
	if body.Language != "" {
		updateState(func(s *sessionState) { s.Language = body.Language })
	}

	agentName := fmt.Sprintf("guide-%s-%d", body.Channel, time.Now().Unix())
	status, raw, err := agoraCall(http.MethodPost, "/join", agoraJoinPayload(body.Channel, body.Token, agentName))
	if err != nil {
		http.Error(w, "agora error: "+err.Error(), http.StatusBadGateway)
		return
	}
	broadcast("agent_started", map[string]any{"channel": body.Channel, "status": status})
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write(raw)
}

func handleAgentStop(w http.ResponseWriter, r *http.Request) {
	writeCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	var body struct {
		AgentID string `json:"agent_id"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	if body.AgentID == "" {
		http.Error(w, `{"error":"agent_id is required"}`, http.StatusBadRequest)
		return
	}

	status, raw, err := agoraCall(http.MethodPost, "/agents/"+body.AgentID+"/leave", nil)
	if err != nil {
		http.Error(w, "agora error: "+err.Error(), http.StatusBadGateway)
		return
	}
	broadcast("agent_stopped", map[string]any{"agent_id": body.AgentID})
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write(raw)
}

func handleAgentStatus(w http.ResponseWriter, r *http.Request) {
	writeCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	agentID := r.URL.Query().Get("agent_id")
	if agentID == "" {
		http.Error(w, `{"error":"agent_id query param is required"}`, http.StatusBadRequest)
		return
	}

	status, raw, err := agoraCall(http.MethodGet, "/agents/"+agentID, nil)
	if err != nil {
		http.Error(w, "agora error: "+err.Error(), http.StatusBadGateway)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write(raw)
}
