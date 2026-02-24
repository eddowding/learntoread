// AudioWorklet processor for low-latency PCM audio capture.
// Buffers raw audio samples and posts Int16 PCM to the main thread.
// ~43ms latency at 48kHz (2048 sample buffer) vs ~250ms with MediaRecorder.

class PCMProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.bufferSize = (options.processorOptions && options.processorOptions.bufferSize) || 2048;
    this.buffer = new Float32Array(this.bufferSize);
    this.offset = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input.length) return true;

    const channel = input[0];
    for (let i = 0; i < channel.length; i++) {
      this.buffer[this.offset++] = channel[i];
      if (this.offset >= this.bufferSize) {
        // Convert float32 [-1, 1] to int16 [-32768, 32767]
        const pcm = new Int16Array(this.bufferSize);
        for (let j = 0; j < this.bufferSize; j++) {
          const s = Math.max(-1, Math.min(1, this.buffer[j]));
          pcm[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        this.port.postMessage(pcm.buffer, [pcm.buffer]);
        this.buffer = new Float32Array(this.bufferSize);
        this.offset = 0;
      }
    }
    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
