/**
 * 上傳音頻並從指定 API 獲取處理後的數據
 * @param {Blob} audioBlob - 要上傳的音頻文件
 * @param {string} apiEndpoint - API 路徑，例如 "/voice_chat"
 * @returns {Promise<{ audioUrl: string, responseText: string, parsedResponse: object, transcription: string }>}
 */
export const uploadAndProcessAudio = async (audioBlob, apiEndpoint = "/voice_chat") => {
    const formData = new FormData();
    formData.append("file", audioBlob, "test.mp3");

    try {
        // 呼叫 API
        const response = await fetch(apiEndpoint, {
            method: "POST",
            body: formData,
        });

        // 檢查回應狀態
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // 解析 JSON 回應
        const data = await response.json();

        // 解碼 Base64 音頻為 Blob 並生成音頻 URL
        const audioBlob = new Blob([Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))], {
            type: "audio/ogg",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        // 返回處理後的數據
        return {
            audioUrl,
            responseText: data.response_text,
            parsedResponse: data.parsed_response,
            transcription: data.transcription,
        };
    } catch (error) {
        console.error("API 呼叫失敗：", error.message);
        throw error;
    }
};
