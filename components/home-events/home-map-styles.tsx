"use client"

export function HomeMapStyles() {
  return (
    <style jsx global>{`
      @keyframes quest-marker-bounce {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-4px);
        }
      }

      @keyframes marker-float {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-4px);
        }
      }

      @keyframes player-beacon-pulse {
        0% {
          transform: scale(0.85);
          opacity: 0.9;
        }
        70% {
          transform: scale(1.7);
          opacity: 0.25;
        }
        100% {
          transform: scale(1.9);
          opacity: 0;
        }
      }

      .player-location-marker__pulse {
        position: absolute;
        inset: 1px;
        border-radius: 50%;
        box-sizing: border-box;
        background: transparent;
        border: 2px solid #4ecdc4;
        box-shadow: 0 0 0 1px #342414;
        animation: player-beacon-pulse 1.8s steps(3) infinite;
      }

      .quest-event-marker.is-active {
        transform: scale(1.2);
      }

      .quest-event-marker:hover .quest-event-marker__body,
      .quest-event-marker.is-active .quest-event-marker__body {
        animation: quest-marker-bounce 0.5s steps(2) infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        @keyframes marker-float {
          0%,
          100% {
            transform: translateY(0);
          }
        }

        .player-location-marker__character,
        .player-location-marker__pulse {
          animation: none !important;
        }

        .player-location-marker__pulse {
          opacity: 0.45;
          transform: scale(1.15);
        }
      }

      @keyframes volume-unmuted-beat {
        0%,
        100% {
          transform: scale(1);
          opacity: 0.88;
        }
        55% {
          transform: scale(1.08);
          opacity: 1;
        }
      }

      @keyframes audio-unmuted-ring {
        0%,
        100% {
          box-shadow: 4px 4px 0 #342414;
        }
        50% {
          box-shadow:
            4px 4px 0 #342414,
            0 0 0 2px rgba(154, 77, 48, 0.45);
        }
      }

      .volume-unmuted-icon {
        transform-origin: center;
        animation: volume-unmuted-beat 1.1s ease-in-out infinite;
      }

      .audio-unmuted-btn {
        animation: audio-unmuted-ring 1.1s ease-in-out infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        .volume-unmuted-icon,
        .audio-unmuted-btn {
          animation: none !important;
        }
      }
    `}</style>
  )
}
