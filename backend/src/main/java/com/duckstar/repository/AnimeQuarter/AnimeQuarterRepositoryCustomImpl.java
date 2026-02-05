package com.duckstar.repository.AnimeQuarter;

import com.duckstar.domain.*;
import com.duckstar.domain.enums.AnimeStatus;
import com.duckstar.domain.enums.DayOfWeekShort;
import com.duckstar.domain.enums.Medium;
import com.duckstar.domain.mapping.QAdminActionLog;
import com.duckstar.domain.mapping.QAnimeOtt;
import com.duckstar.domain.mapping.QAnimeQuarter;
import com.duckstar.web.dto.OttDto;
import com.duckstar.web.dto.AnimeResponseDto.QuarterDto;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.duckstar.web.dto.SearchResponseDto.*;
import static com.duckstar.web.dto.admin.AdminLogDto.*;
import static com.duckstar.web.dto.admin.ContentResponseDto.*;

@Repository
@RequiredArgsConstructor
public class AnimeQuarterRepositoryCustomImpl implements AnimeQuarterRepositoryCustom {

    private final JPAQueryFactory queryFactory;
    private final QQuarter quarter = QQuarter.quarter;
    private final QAnime anime = QAnime.anime;
    private final QAnimeQuarter animeQuarter = QAnimeQuarter.animeQuarter;
    private final QOtt ott = QOtt.ott;
    private final QAnimeOtt animeOtt = QAnimeOtt.animeOtt;
    private final QMember member = QMember.member;
    private final QAdminActionLog adminActionLog = QAdminActionLog.adminActionLog;

    @Override
    public List<AnimePreviewDto> getAnimePreviewsByQuarter(Long quarterId) {
        List<Tuple> tuples = queryFactory.select(
                        anime.id,
                        anime.titleKor,
                        anime.mainThumbnailUrl,
                        anime.status,
                        anime.genre,
                        anime.medium,
                        anime.dayOfWeek,
                        anime.airTime,

                        // 방영 전 애니 디데이 계산과 영화(개봉일 날짜)를 위해 필요
                        anime.premiereDateTime
                )
                .from(animeQuarter)
                .join(animeQuarter.anime, anime)
                .where(animeQuarter.quarter.id.eq(quarterId))
                .fetch();

        List<Long> animeIds = tuples.stream()
                .map(t -> t.get(anime.id))
                .toList();
        if (animeIds.isEmpty()) {
            return List.of();
        }

        List<Tuple> animeOttTuples = queryFactory
                .select(
                        animeOtt.anime.id,
                        ott.type,
                        animeOtt.watchUrl
                )
                .from(animeOtt)
                .join(animeOtt.ott, ott)
                .where(animeOtt.anime.id.in(animeIds))
                .orderBy(ott.typeOrder.asc())
                .fetch();

        Map<Long, List<OttDto>> ottDtosMap = animeOttTuples.stream()
                .collect(Collectors.groupingBy(
                        t -> t.get(animeOtt.anime.id),
                        Collectors.mapping(
                                t -> new OttDto(
                                        t.get(ott.type),
                                        t.get(animeOtt.watchUrl)
                                ),
                                Collectors.toList()
                        )
                ));

        return tuples.stream()
                .map(t -> {
                    Long animeId = t.get(anime.id);
                    List<OttDto> ottDtos = ottDtosMap.getOrDefault(animeId, List.of());

                    AnimeStatus status = t.get(anime.status);
                    Medium medium = t.get(anime.medium);

                    boolean dateNeeded = medium == Medium.MOVIE || status == AnimeStatus.UPCOMING;

                    LocalTime airTime = t.get(anime.airTime);

                    return AnimePreviewDto.builder()
                            .animeId(animeId)
                            .titleKor(t.get(anime.titleKor))
                            .mainThumbnailUrl(t.get(anime.mainThumbnailUrl))
                            .status(status)
                            .genre(t.get(anime.genre))
                            .medium(medium)
                            .ottDtos(ottDtos)
                            .dayOfWeek(DayOfWeekShort.getLogicalDay(airTime, t.get(anime.dayOfWeek)))
                            .scheduledAt(dateNeeded ? t.get(anime.premiereDateTime) : null)
                            .airTime(airTime)
                            .build();
                })
                .toList();
    }

    @Override
    public List<QuarterDto> getQuarterDtosByAnimeId(Long animeId) {
        return queryFactory.select(
                        Projections.constructor(
                                QuarterDto.class,
                                quarter.yearValue,
                                quarter.quarterValue
                        )
                )
                .from(animeQuarter)
                .join(animeQuarter.quarter, quarter)
                .where(animeQuarter.anime.id.eq(animeId))
                .orderBy(quarter.yearValue.asc(), quarter.quarterValue.asc())
                .fetch();
    }

    @Override
    public Page<AdminAnimeDto> getAdminAnimeDtosByQuarterId(Long quarterId, Pageable pageable) {
        List<AdminAnimeDto> content = queryFactory.select(
                        Projections.constructor(
                                AdminAnimeDto.class,
                                anime.id,
                                anime.titleKor,
                                anime.corp,
                                anime.mainThumbnailUrl,
                                anime.status,
                                anime.dayOfWeek,
                                anime.airTime,
                                anime.totalEpisodes,
                                Expressions.as(
                                        Expressions.nullExpression(ManagerProfileDto.class),
                                        "managerProfileDto"
                                )
                        ))
                .from(anime)
                .leftJoin(animeQuarter).on(animeQuarter.anime.id.eq(anime.id))
                .where(quarterIdEq(quarterId))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        List<Long> animeIds = content.stream().map(AdminAnimeDto::getAnimeId).toList();
        if (animeIds.isEmpty()) {
            return Page.empty();
        }

        Map<Long, ManagerProfileDto> latestLogMap = queryFactory.selectFrom(adminActionLog)
                .join(adminActionLog.member, member)
                .where(adminActionLog.anime.id.in(animeIds))
                .orderBy(adminActionLog.createdAt.desc(), adminActionLog.id.desc())
                .fetch()
                .stream()
                .collect(Collectors.toMap(
                                log -> log.getAnime().getId(),
                                log -> ManagerProfileDto.of(log.getMember(), log),
                                (existing, replacement) -> existing
                        )
                );

        content.forEach(dto ->
                {
                    dto.setManagerProfileDto(latestLogMap.get(dto.getAnimeId()));

                    // 요일 포맷팅
                    dto.setDayOfWeek(
                            DayOfWeekShort.getLogicalDay(dto.getAirTime(), dto.getDayOfWeek())
                    );
                }
        );

        // 정렬
        Comparator<AdminAnimeDto> scheduleComparator = (a, b) -> {
            int hourA = DayOfWeekShort.getLogicalHour(a.getAirTime());
            int hourB = DayOfWeekShort.getLogicalHour(b.getAirTime());

            if (hourA != hourB) return Integer.compare(hourA, hourB);

            // 시간이 같으면 분 단위 비교
            return a.getAirTime().getMinute() - b.getAirTime().getMinute();
        };

        content = content.stream()
                .sorted(
                        Comparator.comparing(AdminAnimeDto::getDayOfWeekNumber)
                                .thenComparing(scheduleComparator)
                ).toList();

        // 전체 카운트 쿼리
        Long totalCount = queryFactory
                .select(anime.count())
                .from(anime)
                .leftJoin(animeQuarter).on(animeQuarter.anime.eq(anime))
                .where(quarterIdEq(quarterId))
                .fetchOne();

        // 페이지 결과
        return new PageImpl<>(content, pageable, totalCount != null ? totalCount : 0L);
    }

    private Predicate quarterIdEq(Long quarterId) {
        return quarterId != null ? animeQuarter.quarter.id.eq(quarterId) : null;
    }
}
