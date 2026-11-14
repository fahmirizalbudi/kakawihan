/**
 * Generates a pleasant Sundanese pentatonic chime audio as a standard 16-bit PCM WAV Blob.
 * 100% offline, zero network requests, zero dependencies.
 */
export function generateDemoAudioBlob(): Blob {
  const sampleRate = 44100;
  const durationSec = 4.0;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF header
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + numSamples * 2, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, numSamples * 2, true); // Subchunk2Size

  // Pentatonic notes melody (frequencies in Hz: G4, A4, C5, D5, E5)
  const notes = [
    { freq: 392.0, start: 0.0, dur: 0.9 },
    { freq: 440.0, start: 0.6, dur: 0.9 },
    { freq: 523.25, start: 1.2, dur: 1.0 },
    { freq: 587.33, start: 1.8, dur: 1.1 },
    { freq: 659.25, start: 2.4, dur: 1.4 },
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sampleVal = 0;

    for (const note of notes) {
      if (t >= note.start && t < note.start + note.dur) {
        const noteT = t - note.start;
        // Exponential decay envelope
        const env = Math.exp(-noteT * 3.2);
        // Fundamental + soft overtone
        const wave =
          Math.sin(2 * Math.PI * note.freq * noteT) * 0.7 +
          Math.sin(2 * Math.PI * (note.freq * 2) * noteT) * 0.25;
        sampleVal += wave * env * 0.35;
      }
    }

    const clamped = Math.max(-1, Math.min(1, sampleVal));
    view.setInt16(44 + i * 2, clamped * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}
