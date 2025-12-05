import React from 'react'
import Lottie from 'lottie-react'

// Simple, reliable loading spinner animation
const spinnerAnimation = {
  v: '5.5.7',
  fr: 30,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  nm: 'Loading Spinner',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Spinner',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 0, s: [0] },
            { t: 60, s: [360] }
          ]
        },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            {
              d: 1,
              ty: 'el',
              s: { a: 0, k: [35, 35] },
              p: { a: 0, k: [0, 0] },
              nm: 'Ellipse Path 1'
            },
            {
              ty: 'st',
              c: { a: 0, k: [0.149, 0.463, 0.906, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 5 },
              lc: 2,
              lj: 2,
              ml: 4,
              bm: 0,
              nm: 'Stroke 1',
              dasharray: [10, 5]
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              sk: { a: 0, k: 0 },
              sa: { a: 0, k: 0 },
              nm: 'Transform'
            }
          ],
          nm: 'Ellipse 1',
          mn: 'ADBE Vector Group'
        }
      ],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0
    }
  ],
  markers: []
}

export default function LottieLoader({ size = 80, className = '', style = {} }) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      <Lottie
        animationData={spinnerAnimation}
        loop={true}
        autoplay={true}
        style={{
          width: size,
          height: size,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
        }}
      />
    </div>
  )
}
