export const MOTHERSHIP_SPEED_ANIMATION_CONFIG = {
  version: 1,
  shake: {
    pivot: {
      x: 161.6332667134806,
      y: 61.350614303976016
    },
    lever: {
      x: 111.23324750775727,
      y: 37.276464734147
    },
    speed: 0.5,
    amplitude: 100,
    rotationAngle: 30,
    secondaryVibration: 15
  },
  balls: {
    size: 1.9,
    slideDurationMs: 1000,
    ball1: {
      start: { x: 44.00350343169336, y: 63.34379641366442 },
      end: { x: 50.02712764021676, y: 87.06823925588448 }
    },
    ball2: {
      start: { x: 50.5, y: 66 },
      end: { x: 50, y: 91.93465468183551 }
    }
  },
  slot: {
    x: 48.3,
    y: 84.3,
    width: 3.5,
    height: 9.7,
    radius: 5
  }
};

export function toMothershipSpeedDebugConfig(config = MOTHERSHIP_SPEED_ANIMATION_CONFIG) {
  return {
    version: config.version,
    shake: {
      pivot: { ...config.shake.pivot },
      lever: { ...config.shake.lever },
      speed: config.shake.speed,
      amplitude: config.shake.amplitude,
      rotation: config.shake.rotationAngle,
      secondaryVibration: config.shake.secondaryVibration
    },
    balls: {
      size: config.balls.size,
      fallDurationMs: config.balls.slideDurationMs,
      combination: ["blue", "yellow"],
      slots: [
        { id: "ball-1", start: { ...config.balls.ball1.start }, end: { ...config.balls.ball1.end } },
        { id: "ball-2", start: { ...config.balls.ball2.start }, end: { ...config.balls.ball2.end } }
      ],
      mask: {
        x: config.slot.x,
        y: config.slot.y,
        width: config.slot.width,
        height: config.slot.height,
        cornerRadius: config.slot.radius
      }
    }
  };
}

export function toMothershipSpeedAnimationConfig(debugConfig) {
  return {
    version: debugConfig.version ?? 1,
    shake: {
      pivot: { ...debugConfig.shake.pivot },
      lever: { ...debugConfig.shake.lever },
      speed: debugConfig.shake.speed,
      amplitude: debugConfig.shake.amplitude,
      rotationAngle: debugConfig.shake.rotation,
      secondaryVibration: debugConfig.shake.secondaryVibration
    },
    balls: {
      size: debugConfig.balls.size,
      slideDurationMs: debugConfig.balls.fallDurationMs,
      ball1: {
        start: { ...debugConfig.balls.slots[0].start },
        end: { ...debugConfig.balls.slots[0].end }
      },
      ball2: {
        start: { ...debugConfig.balls.slots[1].start },
        end: { ...debugConfig.balls.slots[1].end }
      }
    },
    slot: {
      x: debugConfig.balls.mask.x,
      y: debugConfig.balls.mask.y,
      width: debugConfig.balls.mask.width,
      height: debugConfig.balls.mask.height,
      radius: debugConfig.balls.mask.cornerRadius ?? 0
    }
  };
}
