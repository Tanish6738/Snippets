import React from 'react'
import StarsCanvas from './StartBackground'
import Hero from './Hero'
import KeyFeatures from './KeyFeatures'

const Landing = () => {
  return (
    <div className="bg-[#030014] text-white min-h-screen w-full relative overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030014]/10 via-[#030014]/50 to-[#030014] z-[2]" />
      
      <video 
        autoPlay
        loop
        muted
        className='absolute top-[-20%] left-0 z-[1] w-full object-cover scale-110'
      >
        <source src='/blackhole.webm' type='video/webm' />
      </video>

      <div className="relative z-[20] w-full">
        <Hero />
        <KeyFeatures />
      </div>

      <div className="absolute inset-0 z-[10]">
        <StarsCanvas />
      </div>
    </div>
  )
}

export default Landing
