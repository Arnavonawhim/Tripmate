package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type chatMessage struct {
	Role       string     `json:"role"`
	Content    any        `json:"content,omitempty"`
	Name       string     `json:"name,omitempty"`
	ToolCallID string     `json:"tool_call_id,omitempty"`
	ToolCalls  []toolCall `json:"tool_calls,omitempty"`
}

type toolCall struct {
	ID       string `json:"id"`
	Type     string `json:"type"`
	Function struct {
		Name      string `json:"name"`
		Arguments string `json:"arguments"`
	} `json:"function"`
}

type chatRequest struct {
	Model    string        `json:"model"`
	Messages []chatMessage `json:"messages"`
	Stream   bool          `json:"stream"`
}

type upstreamRequest struct {
	Model       string        `json:"model"`
	Messages    []chatMessage `json:"messages"`
	Tools       []toolDef     `json:"tools,omitempty"`
	ToolChoice  string        `json:"tool_choice,omitempty"`
	Stream      bool          `json:"stream"`
	Temperature float64       `json:"temperature"`
}

type upstreamResponse struct {
	Choices []struct {
		Message      chatMessage `json:"message"`
		FinishReason string      `json:"finish_reason"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

const systemPrompt = `You are a friendly AR tour guide. The user sees you as a 3D character standing on the ground beside them and speaks to you out loud.
Keep every reply to one to three short spoken sentences. Never use markdown, lists or emoji.
You can see through the user's camera: call get_scene_context whenever they say this, that, or ask what they are looking at.
You can act: save places, navigate, find nearby spots, translate signs. Call the tool instead of saying you cannot.
After navigating, say the direction naturally, for example it is about two hundred metres behind you, follow me.
Always reply in the same language the user spoke.`

func authorized(r *http.Request) bool {
	if gatewayAPIKey == "" {
		return true
	}
	sent := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
	return strings.TrimSpace(sent) == gatewayAPIKey}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."}

func parseFloat(s string) (float64, error) {
	return strconv.ParseFloat(strings.TrimSpace(s), 64)}

func contentString(v any) string {
	switch c := v.(type) {
	case string:
		return c
	case []any:
		var sb strings.Builder
		for _, part := range c {
			if m, ok := part.(map[string]any); ok {
				if t, ok := m["text"].(string); ok {
					sb.WriteString(t)
				}
			}
		}
		return sb.String()
	}
	return ""}

func buildMessages(incoming []chatMessage) []chatMessage {
	s := snapshotState()
	lines := []string{fmt.Sprintf("Live context: user is at lat %.5f lng %.5f facing %.0f degrees.", s.Lat, s.Lng, s.Heading)}
	if s.Scene != "" && time.Since(s.SceneAt) < 30*time.Second {
		lines = append(lines, "The camera currently sees: "+s.Scene)
	}
	if len(s.Places) > 0 {
		lines = append(lines, "Saved places: "+keysOf(s.Places)+".")
	}

	out := []chatMessage{
		{Role: "system", Content: systemPrompt},
		{Role: "system", Content: strings.Join(lines, " ")},
	}
	for _, m := range incoming {
		if m.Role == "system" {
			continue
		}
		out = append(out, m)
	}
	return out}

func callToolLLM(ctx context.Context, messages []chatMessage) (*upstreamResponse, error) {
	payload := upstreamRequest{
		Model:       toolLLMModel,
		Messages:    messages,
		Tools:       agentTools(),
		ToolChoice:  "auto",
		Stream:      false,
		Temperature: 0.4,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		strings.TrimSuffix(toolLLMBase, "/")+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+toolLLMKey)

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("tool llm %d: %s", resp.StatusCode, truncate(string(raw), 300))
	}

	var parsed upstreamResponse
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, err
	}
	if parsed.Error != nil {
		return nil, fmt.Errorf("tool llm error: %s", parsed.Error.Message)
	}
	return &parsed, nil}

func writeChatJSON(w http.ResponseWriter, model, answer string) {
	writeJSON(w, http.StatusOK, map[string]any{
		"id":      fmt.Sprintf("chatcmpl-%d", time.Now().UnixNano()),
		"object":  "chat.completion",
		"created": time.Now().Unix(),
		"model":   model,
		"choices": []any{map[string]any{
			"index":         0,
			"message":       map[string]any{"role": "assistant", "content": answer},
			"finish_reason": "stop",
		}},
	})
}

func writeChatStream(w http.ResponseWriter, model, answer string) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		writeChatJSON(w, model, answer)
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.WriteHeader(http.StatusOK)

	id := fmt.Sprintf("chatcmpl-%d", time.Now().UnixNano())
	created := time.Now().Unix()

	emit := func(delta map[string]any, finish any) {
		chunk := map[string]any{
			"id":      id,
			"object":  "chat.completion.chunk",
			"created": created,
			"model":   model,
			"choices": []any{map[string]any{
				"index":         0,
				"delta":         delta,
				"finish_reason": finish,
			}},
		}
		b, _ := json.Marshal(chunk)
		fmt.Fprintf(w, "data: %s\n\n", b)
		flusher.Flush()
	}

	emit(map[string]any{"role": "assistant"}, nil)
	for _, word := range strings.Fields(answer) {
		emit(map[string]any{"content": word + " "}, nil)
	}
	emit(map[string]any{}, "stop")
	fmt.Fprint(w, "data: [DONE]\n\n")
	flusher.Flush()
}

func writeAnswer(w http.ResponseWriter, req chatRequest, answer string) {
	if strings.TrimSpace(answer) == "" {
		answer = "Sorry, could you say that again?"
	}
	broadcast("agent_reply", map[string]any{"text": answer})
	if req.Stream {
		writeChatStream(w, req.Model, answer)
		return
	}
	writeChatJSON(w, req.Model, answer)
}

func handleChatCompletions(w http.ResponseWriter, r *http.Request) {
	writeCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if !authorized(r) {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req chatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad json: "+err.Error(), http.StatusBadRequest)
		return
	}
	if req.Model == "" {
		req.Model = toolLLMModel
	}

	start := time.Now()
	messages := buildMessages(req.Messages)

	for hop := 0; hop < 3; hop++ {
		resp, err := callToolLLM(r.Context(), messages)
		if err != nil {
			log.Printf("voice turn failed: %v", err)
			writeAnswer(w, req, "Sorry, I could not reach my brain just then. Try once more.")
			return
		}
		if len(resp.Choices) == 0 {
			writeAnswer(w, req, "Sorry, I did not catch that.")
			return
		}

		msg := resp.Choices[0].Message
		if len(msg.ToolCalls) == 0 {
			log.Printf("voice turn ok in %dms hops=%d", time.Since(start).Milliseconds(), hop)
			writeAnswer(w, req, contentString(msg.Content))
			return
		}

		messages = append(messages, msg)
		for _, tc := range msg.ToolCalls {
			log.Printf("tool call %s args=%s", tc.Function.Name, truncate(tc.Function.Arguments, 200))
			broadcast("tool_started", map[string]any{"name": tc.Function.Name})
			result := executeTool(tc.Function.Name, tc.Function.Arguments)
			messages = append(messages, chatMessage{
				Role:       "tool",
				Name:       tc.Function.Name,
				ToolCallID: tc.ID,
				Content:    result,
			})
		}
	}
	writeAnswer(w, req, "That took too many steps. Could you ask me a simpler way?")
}
