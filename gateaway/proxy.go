package main

import (
	"io"
	"net/http"
	"time"
)

var httpClient = &http.Client{Timeout: 90 * time.Second}

func forward(w http.ResponseWriter, r *http.Request, targetBase, path string) {
	req, err := http.NewRequest(r.Method, targetBase+path, r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	req.Header.Set("Content-Type", r.Header.Get("Content-Type")) 

	resp, err := httpClient.Do(req)
	if err != nil {
		http.Error(w, "upstream error: "+err.Error(), http.StatusBadGateway) // 502
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}