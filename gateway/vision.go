package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type nearbyPlace struct {
	Name       string  `json:"name"`
	DistanceM  float64 `json:"distance_m"`
	BearingDeg float64 `json:"bearing_deg"`
	Lat        float64 `json:"lat"`
	Lng        float64 `json:"lng"`
}

func askVision(question string) (string, error) {
	frame, contentType := loadFrame()
	if len(frame) == 0 {
		return "", errors.New("no camera frame available yet")
	}

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	partHeader := make(map[string][]string)
	partHeader["Content-Disposition"] = []string{`form-data; name="image"; filename="frame.jpg"`}
	partHeader["Content-Type"] = []string{contentType}
	part, err := writer.CreatePart(partHeader)
	if err != nil {
		return "", err
	}
	if _, err := part.Write(frame); err != nil {
		return "", err
	}
	if err := writer.WriteField("question", question); err != nil {
		return "", err
	}
	if err := writer.WriteField("use_cache", "true"); err != nil {
		return "", err
	}
	if err := writer.Close(); err != nil {
		return "", err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, strings.TrimSuffix(visionURL, "/")+"/scene", body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		return "", fmt.Errorf("vision worker %d: %s", resp.StatusCode, truncate(string(raw), 200))
	}

	var parsed struct {
		Answer    string `json:"answer"`
		TextFound string `json:"text_found"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return "", err
	}
	if parsed.Answer == "" {
		return "", errors.New("vision worker returned an empty answer")
	}
	return parsed.Answer, nil}

func findNearby(query string, lat, lng float64) ([]nearbyPlace, error) {
	if query == "" {
		return nil, errors.New("query is required")
	}
	if lat == 0 && lng == 0 {
		return nil, errors.New("no GPS fix yet")
	}

	endpoint := fmt.Sprintf("%s/search?q=%s&format=jsonv2&limit=5&lat=%f&lon=%f&bounded=0",
		strings.TrimSuffix(nominatimBase, "/"), url.QueryEscape(query), lat, lng)

	ctx, cancel := context.WithTimeout(context.Background(), 12*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "trip-mate-gateway/0.1")

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("places lookup %d", resp.StatusCode)
	}

	var hits []struct {
		Name        string `json:"name"`
		DisplayName string `json:"display_name"`
		Lat         string `json:"lat"`
		Lon         string `json:"lon"`
	}
	if err := json.Unmarshal(raw, &hits); err != nil {
		return nil, err
	}

	out := make([]nearbyPlace, 0, len(hits))
	for _, h := range hits {
		plat, err1 := parseFloat(h.Lat)
		plng, err2 := parseFloat(h.Lon)
		if err1 != nil || err2 != nil {
			continue
		}
		dist, bearing := haversine(lat, lng, plat, plng)
		name := h.Name
		if name == "" {
			name = strings.Split(h.DisplayName, ",")[0]
		}
		out = append(out, nearbyPlace{
			Name:       name,
			DistanceM:  float64(int(dist)),
			BearingDeg: float64(int(bearing)),
			Lat:        plat,
			Lng:        plng,
		})
	}
	if len(out) == 0 {
		return nil, errors.New("nothing found nearby")
	}
	return out, nil}
