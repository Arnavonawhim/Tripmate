package main

import (
	"io"
	"net/http"
	"strings"
	"time"
)

var httpClient = &http.Client{Timeout: 90 * time.Second}

var streamClient = &http.Client{Timeout: 0}

var hopHeaders = map[string]bool{
	"Connection":          true,
	"Keep-Alive":          true,
	"Proxy-Connection":    true,
	"Te":                  true,
	"Trailer":             true,
	"Transfer-Encoding":   true,
	"Upgrade":             true,
	"Proxy-Authenticate":  true,
	"Proxy-Authorization": true,}

func copyHeaders(dst, src http.Header) {
	for k, vv := range src {
		if hopHeaders[http.CanonicalHeaderKey(k)] {
			continue}
		for _, v := range vv {
			dst.Add(k, v)}}}

func wantsStream(r *http.Request) bool {
	if strings.Contains(r.Header.Get("Accept"), "text/event-stream") {
		return true}
	return strings.Contains(r.URL.Path, "/stream")}

func streamCopy(dst http.ResponseWriter, src io.Reader) {
	flusher, canFlush := dst.(http.Flusher)
	buf := make([]byte, 4096)
	for {
		n, err := src.Read(buf)
		if n > 0 {
			if _, werr := dst.Write(buf[:n]); werr != nil {
				return}
			if canFlush {
				flusher.Flush()}
		}
		if err != nil {
			return
		}
	}
}

func forward(w http.ResponseWriter, r *http.Request, targetBase, path string) {
	target := strings.TrimSuffix(targetBase, "/") + path
	if r.URL.RawQuery != "" {
		target += "?" + r.URL.RawQuery}

	req, err := http.NewRequestWithContext(r.Context(), r.Method, target, r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return}
	copyHeaders(req.Header, r.Header)
	req.Header.Del("Host")
	req.ContentLength = r.ContentLength

	client := httpClient
	if wantsStream(r) {
		client = streamClient}

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "upstream error: "+err.Error(), http.StatusBadGateway)
		return	}
	defer resp.Body.Close()

	copyHeaders(w.Header(), resp.Header)
	w.WriteHeader(resp.StatusCode)
	streamCopy(w, resp.Body)
}
