package com.duckstar.web.dto.admin;

import com.duckstar.domain.enums.AnimeStatus;
import com.duckstar.domain.enums.DayOfWeekShort;
import com.duckstar.domain.enums.Medium;
import com.duckstar.web.dto.OttDto;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public class AnimeRequestDto {

    @Builder
    @Getter
    @Setter  // ModelAttribute 는 세터 필수
    @NoArgsConstructor // 역직렬화를 위해 기본 생성자 추가 권장
    @AllArgsConstructor
    public static class PostRequestDto {

        @NotNull
        String titleKor;
        String titleOrigin;
        String titleEng;

        @NotNull
        Medium medium;

        LocalDateTime premiereDateTime;  // 입력 시 프론트에서 아래 요일에 우선 채워줌
        DayOfWeekShort dayOfWeek;

        @Schema(example = "23:00:00", type = "string")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm:ss", timezone = "Asia/Seoul")
        LocalTime airTime;

        Integer totalEpisodes;

        String corp;
        String director;
        String genre;
        String author;  // 원작
        Integer minAge;  // 시청 등급
        String officialSiteString;
        String synopsis;

        MultipartFile mainImage;

        List<OttDto> ottDtos;
    }

    @Getter
    @Setter  // ModelAttribute 는 세터 필수
    public static class ImageRequestDto {
        MultipartFile mainImage;
    }

    @Builder
    @Getter
    public static class TotalEpisodesRequestDto {
        @NotNull
        @Min(1)
        @Max(100)
        Integer totalEpisodes;
    }

    @Builder
    @Getter
    @NoArgsConstructor // 역직렬화를 위해 기본 생성자 추가 권장
    @AllArgsConstructor
    public static class InfoRequestDto {
        DayOfWeekShort dayOfWeek;

        @Schema(example = "23:00:00", type = "string")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm:ss", timezone = "Asia/Seoul")
        LocalTime airTime;

        AnimeStatus status;

        String corp;
    }
}
