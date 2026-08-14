package main

import (
	"encoding/json"
	"fmt"
	"math"
	"strings"
	"time"
)

type toolFn struct {
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Parameters  map[string]any `json:"parameters"`
}

type toolDef struct {
	Type     string `json:"type"`
	Function toolFn `json:"function"`
}

func obj(props map[string]any, required ...string) map[string]any {
	if required == nil {
		required = []string{}
	}
	return map[string]any{
		"type":       "object",
		"properties": props,
		"required":   required,
	}
}

func str(desc string) map[string]any {
	return map[string]any{"type": "string", "description": desc}}

func agentTools() []toolDef {
	return []toolDef{
		{Type: "function", Function: toolFn{
			Name:        "get_scene_context",
			Description: "Describe what the user's camera is looking at right now. Call this whenever the user says 'this', 'that', or asks what they are looking at.",
			Parameters:  obj(map[string]any{"question": str("Optional specific question about the scene.")}),
		}},
		{Type: "function", Function: toolFn{
			Name:        "save_place",
			Description: "Save the user's current location under a name so they can be guided back later. Use for 'remember where I parked' or 'save my hotel'.",
			Parameters:  obj(map[string]any{"name": str("Short label such as car or hotel.")}, "name"),
		}},
		{Type: "function", Function: toolFn{
			Name:        "navigate_to",
			Description: "Start AR navigation to a saved place. Returns distance and bearing so the 3D guide can point and walk there.",
			Parameters:  obj(map[string]any{"destination": str("Saved place name.")}, "destination"),
		}},
		{Type: "function", Function: toolFn{
			Name:        "find_nearby",
			Description: "Find nearby places such as cafes, ATMs, restrooms or attractions around the user.",
			Parameters:  obj(map[string]any{"query": str("What to look for, such as coffee or pharmacy.")}, "query"),
		}},
		{Type: "function", Function: toolFn{
			Name:        "translate_text",
			Description: "Read and translate text the camera can see, such as a menu or a street sign.",
			Parameters:  obj(map[string]any{"target_language": str("Language to translate into.")}, "target_language"),
		}},
		{Type: "function", Function: toolFn{
			Name:        "get_itinerary",
			Description: "Get the user's TripSync itinerary and what is planned next on the trip.",
			Parameters:  obj(map[string]any{}),
		}},
		{Type: "function", Function: toolFn{
			Name:        "request_human_guide",
			Description: "Bring a real human local guide into the live voice call. Use only when the user explicitly asks for a human.",
			Parameters:  obj(map[string]any{"reason": str("Why the user wants a human guide.")}),
		}},
	}
}

func haversine(lat1, lon1, lat2, lon2 float64) (float64, float64) {
	const R = 6371000.0
	rad := math.Pi / 180
	p1, p2 := lat1*rad, lat2*rad
	dp, dl := (lat2-lat1)*rad, (lon2-lon1)*rad
	a := math.Sin(dp/2)*math.Sin(dp/2) + math.Cos(p1)*math.Cos(p2)*math.Sin(dl/2)*math.Sin(dl/2)
	dist := 2 * R * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	y := math.Sin(dl) * math.Cos(p2)
	x := math.Cos(p1)*math.Sin(p2) - math.Sin(p1)*math.Cos(p2)*math.Cos(dl)
	bearing := math.Mod(math.Atan2(y, x)/rad+360, 360)
	return dist, bearing}

func executeTool(name string, rawArgs string) string {
	var args map[string]any
	_ = json.Unmarshal([]byte(rawArgs), &args)
	argStr := func(k string) string {
		if v, ok := args[k].(string); ok {
			return v
		}
		return ""}
	s := snapshotState()

	switch name {
	case "get_scene_context":
		question := argStr("question")
		if question == "" {
			question = "What is in this image? Answer in one or two short sentences."
		}
		answer, err := askVision(question)
		if err != nil {
			if s.Scene != "" {
				return fmt.Sprintf(`{"scene":%q,"stale":true}`, s.Scene)
			}
			return fmt.Sprintf(`{"error":%q}`, err.Error())
		}
		updateState(func(st *sessionState) {
			st.Scene = answer
			st.SceneAt = time.Now()
		})
		broadcast("scene", map[string]any{"description": answer})
		return fmt.Sprintf(`{"scene":%q}`, answer)

	case "save_place":
		label := strings.ToLower(strings.TrimSpace(argStr("name")))
		if label == "" {
			return `{"error":"name is required"}`
		}
		if s.Lat == 0 && s.Lng == 0 {
			return `{"error":"no GPS fix yet, ask the user to enable location"}`
		}
		updateState(func(st *sessionState) { st.Places[label] = [2]float64{s.Lat, s.Lng} })
		broadcast("save_place", map[string]any{"name": label, "lat": s.Lat, "lng": s.Lng})
		return fmt.Sprintf(`{"saved":%q,"lat":%f,"lng":%f}`, label, s.Lat, s.Lng)

	case "navigate_to":
		dest := strings.ToLower(strings.TrimSpace(argStr("destination")))
		coords, ok := s.Places[dest]
		if !ok {
			return fmt.Sprintf(`{"error":"nothing saved as %q","saved_places":%q}`, dest, keysOf(s.Places))
		}
		dist, bearing := haversine(s.Lat, s.Lng, coords[0], coords[1])
		broadcast("navigate", map[string]any{
			"destination":  dest,
			"lat":          coords[0],
			"lng":          coords[1],
			"distance_m":   math.Round(dist),
			"bearing":      math.Round(bearing),
			"guide_action": "point_and_walk",
		})
		return fmt.Sprintf(`{"destination":%q,"distance_m":%.0f,"bearing_deg":%.0f,"relative":%q}`,
			dest, dist, bearing, relativeDirection(s.Heading, bearing))

	case "find_nearby":
		results, err := findNearby(argStr("query"), s.Lat, s.Lng)
		if err != nil {
			return fmt.Sprintf(`{"error":%q}`, err.Error())
		}
		broadcast("nearby", map[string]any{"query": argStr("query"), "results": results})
		b, _ := json.Marshal(map[string]any{"results": results})
		return string(b)

	case "translate_text":
		lang := argStr("target_language")
		if lang == "" {
			lang = "English"
		}
		answer, err := askVision("Read every piece of text in this image and translate it into " + lang + ". Be concise and skip anything unreadable.")
		if err != nil {
			return fmt.Sprintf(`{"error":%q}`, err.Error())
		}
		broadcast("translation", map[string]any{"text": answer, "language": lang})
		return fmt.Sprintf(`{"translation":%q}`, answer)

	case "get_itinerary":
		return `{"status":"TripSync integration not wired yet","items":[]}`

	case "request_human_guide":
		broadcast("human_handoff", map[string]any{"reason": argStr("reason"), "status": "requested"})
		return `{"status":"a local guide has been paged and will join this call shortly"}`
	}
	return fmt.Sprintf(`{"error":"unknown tool %q"}`, name)}

func relativeDirection(heading, bearing float64) string {
	delta := math.Mod(bearing-heading+360, 360)
	switch {
	case delta < 30 || delta >= 330:
		return "straight ahead"
	case delta < 150:
		return "to your right"
	case delta < 210:
		return "behind you"
	default:
		return "to your left"
	}
}
