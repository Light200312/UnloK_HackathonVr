"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import { EffectCoverflow, Navigation } from "swiper/modules";

// Import your three big components
import ChallengeComponent from "../pages/DailtQuestForSlider";   // Daily
import WeeklyChallenges from "../pages/WeeklyChallengeForQuest";       // Weekly
import MonthlyChallenges from "../pages/MonthlyChallengeForQuest";     // Monthly

const ChallengeCarousel = () => {
  return (
    <div className="w-full h-screen flex flex-col items-center bg-gray-900">
      {/* Navigation Buttons */}
      <div className="mt-6 mb-4 flex gap-4 z-10">
        <button className="swiper-button-prev px-6 py-2 bg-gray-800 text-white rounded-lg shadow">
          Prev
        </button>
        <button className="swiper-button-next px-6 py-2 bg-gray-800 text-white rounded-lg shadow">
          Next
        </button>
      </div>

      {/* Swiper */}
      <Swiper
        effect={"coverflow"}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={2.5}     // middle + peek sides
        spaceBetween={-150}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 250,   // scaling depth
          modifier: 2,
          slideShadows: false,
        }}
        navigation={{
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        }}
        modules={[EffectCoverflow, Navigation]}
        className="w-full h-full mt-18 "
      >
        {/* Slide 1 - Daily */}
        <SwiperSlide>
          <div className="p-8 w-full">
            <ChallengeComponent />
          </div>
        </SwiperSlide>

        {/* Slide 2 - Weekly */}
        <SwiperSlide>
          <div  className="p-8  w-full">
            <WeeklyChallenges />
          </div>
        </SwiperSlide>

        {/* Slide 3 - Monthly */}
        <SwiperSlide>
          <div className="p-8  w-full">
            <MonthlyChallenges />
          </div>
        </SwiperSlide>
     
      </Swiper>
    </div>
  );
};

export default ChallengeCarousel;
