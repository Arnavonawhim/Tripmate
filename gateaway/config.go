package main

import "os"

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

var (
	routerURL   = getenv("ROUTER_URL", "http://localhost:8000")
	visionURL   = getenv("VISION_URL", "http://localhost:8001")
	gatewayPort = getenv("PORT", "9000")
)