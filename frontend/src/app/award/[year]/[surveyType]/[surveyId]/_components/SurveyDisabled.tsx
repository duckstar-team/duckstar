import { SurveyDto, VoteStatusType } from '@/types';
import React from 'react';
import SurveyCountdown from './SurveyCountdown';

export default function SurveyDisabled({ survey }: { survey: SurveyDto }) {
  const isNotYet = survey.status === VoteStatusType.NotYet;

  if (isNotYet) {
    return (
      <section className="max-width px-10!">
        <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-2 rounded border border-gray-200 bg-white p-6 shadow-lg">
          <img
            src="/survey_not_yet.jpeg"
            alt="survey-not-yet"
            className="mb-4 w-1/2 object-cover @max-sm:w-1/2"
          />
          <h2 className="text-xl font-semibold text-black">
            투표 오픈 전입니다.
          </h2>
          <p className="my-6 text-center text-gray-600">
            <SurveyCountdown
              startDate={survey?.startDateTime}
              className="text-[1.5rem] font-bold! text-red-400! @md:text-[2rem]"
            />
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-width px-10!">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-2 rounded border border-gray-200 bg-white p-6 shadow-lg">
        <img
          src="/award-closed.jpg"
          alt="survey-not-yet"
          className="mb-4 w-1/2 object-cover @max-sm:w-1/2"
        />
        <h2 className="text-xl font-semibold text-black">
          투표 결과 집계 중입니다.
        </h2>
        <p className="my-6 text-center text-gray-600">
          <SurveyCountdown
            type={VoteStatusType.Closed}
            text="결과 공개까지"
            startDate={survey?.endDateTime}
            className="text-[1.5rem] font-bold! text-red-400! @md:text-[2rem]"
          />
        </p>
      </div>
    </section>
  );
}
