package main

import (
	"bytes"
	"compress/zlib"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"math/rand"
	"net/http"
	"strconv"
	"time"
)

const (
	tokenVersion      = "007"
	serviceTypeRTC    = 1
	privilegeJoin     = 1
	privilegePubAudio = 2
	privilegePubVideo = 3
	privilegePubData  = 4
	tokenTTLSeconds   = 3600
)

func packUint16(buf *bytes.Buffer, v uint16) {
	_ = binary.Write(buf, binary.LittleEndian, v)
}

func packUint32(buf *bytes.Buffer, v uint32) {
	_ = binary.Write(buf, binary.LittleEndian, v)
}

func packString(buf *bytes.Buffer, s string) {
	packUint16(buf, uint16(len(s)))
	buf.WriteString(s)
}

func uint32Bytes(v uint32) []byte {
	buf := new(bytes.Buffer)
	packUint32(buf, v)
	return buf.Bytes()
}

func hmacBytes(key, msg []byte) []byte {
	mac := hmac.New(sha256.New, key)
	mac.Write(msg)
	return mac.Sum(nil)
}

func packPrivileges(buf *bytes.Buffer, expire uint32) {
	privileges := []uint16{privilegeJoin, privilegePubAudio, privilegePubVideo, privilegePubData}
	packUint16(buf, uint16(len(privileges)))
	for _, p := range privileges {
		packUint16(buf, p)
		packUint32(buf, expire)
	}
}

func buildRTCToken(appID, appCert, channel string, uid uint32, ttl uint32) (string, error) {
	issued := uint32(time.Now().Unix())
	salt := uint32(rand.Int31n(99999999) + 1)

	signKey := hmacBytes(uint32Bytes(issued), []byte(appCert))
	signKey = hmacBytes(uint32Bytes(salt), signKey)

	body := new(bytes.Buffer)
	packString(body, appID)
	packUint32(body, issued)
	packUint32(body, ttl)
	packUint32(body, salt)
	packUint16(body, 1)
	packUint16(body, serviceTypeRTC)
	packPrivileges(body, ttl)
	packString(body, channel)

	uidStr := ""
	if uid != 0 {
		uidStr = strconv.FormatUint(uint64(uid), 10)
	}
	packString(body, uidStr)

	signature := hmacBytes(signKey, body.Bytes())

	content := new(bytes.Buffer)
	packString(content, string(signature))
	content.Write(body.Bytes())

	var packed bytes.Buffer
	writer := zlib.NewWriter(&packed)
	if _, err := writer.Write(content.Bytes()); err != nil {
		return "", err
	}
	if err := writer.Close(); err != nil {
		return "", err
	}
	return tokenVersion + base64.StdEncoding.EncodeToString(packed.Bytes()), nil
}

func handleRTCToken(w http.ResponseWriter, r *http.Request) {
	writeCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}
	if agoraAppID == "" {
		http.Error(w, `{"error":"AGORA_APP_ID is not set"}`, http.StatusPreconditionFailed)
		return
	}

	var body struct {
		Channel string `json:"channel"`
		UID     uint32 `json:"uid"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	if body.Channel == "" {
		http.Error(w, `{"error":"channel is required"}`, http.StatusBadRequest)
		return
	}

	if agoraAppCert == "" {
		writeJSON(w, http.StatusOK, map[string]any{
			"token":   "",
			"channel": body.Channel,
			"mode":    "app_id_only",
		})
		return
	}

	token, err := buildRTCToken(agoraAppID, agoraAppCert, body.Channel, body.UID, tokenTTLSeconds)
	if err != nil {
		http.Error(w, `{"error":"token build failed"}`, http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"token":      token,
		"channel":    body.Channel,
		"expires_in": tokenTTLSeconds,
		"mode":       "secured",
	})
}
