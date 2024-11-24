/**
 * 上傳音頻並獲取處理後的音頻文件 URL
 * @param {Blob} audioBlob - 要上傳的音頻文件
 * @returns {Promise<string>} - 返回處理後音頻文件的 URL
 */
export const uploadAndProcessAudio = async (audioBlob) => {
const formData = new FormData();
formData.append("file", audioBlob, "test.mp3");

try {
    // 呼叫 API
    const response = await fetch("/voice_chat", {
    method: "POST",
    body: formData,
    });

    // 檢查回應狀態
    if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // 獲取處理後的音頻 Blob
    const processedAudioBlob = await response.blob();

    // 生成音頻 URL
    return URL.createObjectURL(processedAudioBlob);
} catch (error) {
    console.error("API 呼叫失敗：", error.message);
    throw error;
}
};
