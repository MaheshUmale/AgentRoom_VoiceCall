/**
 * WebRTC Media Stream Utility & Canvas Avatar Stream Generator
 */

export interface AvatarStreamConfig {
  name: string;
  role: 'user' | 'pm_orchestrator' | 'sub_agent';
  personaType?: string;
  isSpeaking: boolean;
  status: string;
}

/**
 * Creates an animated video track from a Canvas element for AI bot participants
 */
export function createAvatarVideoStream(config: AvatarStreamConfig): {
  stream: MediaStream;
  cleanup: () => void;
  updateSpeaking: (speaking: boolean) => void;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;

  let isSpeaking = config.isSpeaking;
  let animFrameId: number;
  let pulsePhase = 0;

  // Render loop for bot video stream
  const render = () => {
    pulsePhase += 0.05;

    // Background gradient based on role
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    if (config.role === 'pm_orchestrator') {
      gradient.addColorStop(0, '#0f172a'); // slate-900
      gradient.addColorStop(0.5, '#1e1b4b'); // indigo-950
      gradient.addColorStop(1, '#31104b'); // purple-950
    } else if (config.role === 'sub_agent') {
      gradient.addColorStop(0, '#090d16');
      gradient.addColorStop(0.5, '#082f49'); // sky-950
      gradient.addColorStop(1, '#0284c7'); // sky-600
    } else {
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#1e293b');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle background mesh grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Avatar Circle Center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 20;
    const radius = 80;

    // Outer Pulsing Audio Halo when speaking
    if (isSpeaking) {
      const ringRadius = radius + 15 + Math.sin(pulsePhase * 3) * 12;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = config.role === 'pm_orchestrator' ? 'rgba(129, 140, 248, 0.6)' : 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 4;
      ctx.stroke();

      const ring2Radius = radius + 30 + Math.cos(pulsePhase * 2) * 18;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ring2Radius, 0, Math.PI * 2);
      ctx.strokeStyle = config.role === 'pm_orchestrator' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(14, 165, 233, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Base Avatar Circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = config.role === 'pm_orchestrator' ? '#3730a3' : '#0369a1';
    ctx.fill();
    ctx.strokeStyle = config.role === 'pm_orchestrator' ? '#818cf8' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Initial Letter
    ctx.font = 'bold 64px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.name.charAt(0).toUpperCase(), centerX, centerY);

    // Audio Wave Spectrum Bar Indicator at Bottom of Video Canvas
    if (isSpeaking) {
      const barWidth = 8;
      const barGap = 6;
      const numBars = 16;
      const startX = centerX - (numBars * (barWidth + barGap)) / 2;
      const bottomY = canvas.height - 50;

      for (let i = 0; i < numBars; i++) {
        const height = 10 + Math.abs(Math.sin(pulsePhase * 4 + i * 0.4)) * 35;
        const x = startX + i * (barWidth + barGap);
        ctx.fillStyle = config.role === 'pm_orchestrator' ? '#a855f7' : '#38bdf8';
        ctx.beginPath();
        ctx.roundRect(x, bottomY - height, barWidth, height, 4);
        ctx.fill();
      }
    }

    // Agent Name Overlay Tag on Video
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText(config.name, centerX, canvas.height - 25);

    animFrameId = requestAnimationFrame(render);
  };

  render();

  const stream = canvas.captureStream(30);

  return {
    stream,
    cleanup: () => {
      cancelAnimationFrame(animFrameId);
    },
    updateSpeaking: (speaking: boolean) => {
      isSpeaking = speaking;
    },
  };
}

/**
 * Accesses User Webcam and Microphone
 */
export async function getMediaDevicesStream(audio = true, video = true): Promise<MediaStream | null> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('getUserMedia not supported in this environment');
      return null;
    }
    return await navigator.mediaDevices.getUserMedia({ audio, video });
  } catch (err) {
    console.warn('Unable to access camera/mic, falling back to simulated stream:', err);
    return null;
  }
}
