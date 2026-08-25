package main

import (
	"os"
	"strings"
)

func readDotenv(path string) map[string]string {
	out := map[string]string{}
	raw, err := os.ReadFile(path)
	if err != nil {
		return out
	}
	for _, line := range strings.Split(string(raw), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		out[strings.TrimSpace(key)] = strings.Trim(strings.TrimSpace(value), `"'`)
	}
	return out
}

var dotenv = readDotenv(".env")

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	if v := dotenv[key]; v != "" {
		return v
	}
	return fallback
}

var (
	routerURL   = getenv("ROUTER_URL", "http://localhost:8000")
	visionURL   = getenv("VISION_URL", "http://localhost:8001")
	gatewayPort = getenv("PORT", "9000")

	toolLLMBase  = getenv("TOOL_LLM_BASE", "https://api.groq.com/openai/v1")
	toolLLMKey   = getenv("TOOL_LLM_KEY", getenv("groq_api", ""))
	toolLLMModel = getenv("TOOL_LLM_MODEL", "llama-3.3-70b-versatile")

	gatewayAPIKey = getenv("GATEWAY_API_KEY", "dev-key")

	agoraAppID       = getenv("AGORA_APP_ID", "")
	agoraCustomerID  = getenv("AGORA_CUSTOMER_ID", "")
	agoraCustomerSec = getenv("AGORA_CUSTOMER_SECRET", "")
	agoraConvoAIBase = getenv("AGORA_CONVOAI_BASE", "https://api.agora.io/api/conversational-ai-agent/v2/projects")
	agoraAgentUID    = getenv("AGORA_AGENT_UID", "1001")
	agoraAppCert     = getenv("AGORA_APP_CERTIFICATE", "")

	publicGatewayURL = getenv("PUBLIC_GATEWAY_URL", "")

	asrLanguage = getenv("ASR_LANGUAGE", "en-US")
	ttsVendor   = getenv("TTS_VENDOR", "elevenlabs")
	ttsKey      = getenv("TTS_KEY", "")
	ttsVoice    = getenv("TTS_VOICE_ID", "")

	nominatimBase = getenv("NOMINATIM_BASE", "https://nominatim.openstreetmap.org")
	enableAIVAD = getenv("ENABLE_AIVAD", "false") == "true"
)
