package com.duckstar.repository.AdminActionLog;

import com.duckstar.domain.QAnime;
import com.duckstar.domain.QMember;
import com.duckstar.domain.QQuarter;
import com.duckstar.domain.QWeek;
import com.duckstar.domain.enums.ManageFilterType;
import com.duckstar.domain.mapping.QAdminActionLog;
import com.duckstar.domain.mapping.weeklyVote.QEpisode;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

import static com.duckstar.web.dto.WeekResponseDto.*;
import static com.duckstar.web.dto.admin.AdminLogDto.*;

@Repository
@RequiredArgsConstructor
public class AdminActionLogRepositoryCustomImpl implements AdminActionLogRepositoryCustom {
    private final JPAQueryFactory queryFactory;
    private final QAdminActionLog adminActionLog = QAdminActionLog.adminActionLog;
    private final QWeek week = QWeek.week;
    private final QQuarter quarter = QQuarter.quarter;
    private final QAnime anime = QAnime.anime;
    private final QEpisode episode = QEpisode.episode;
    private final QMember member = QMember.member;

    @Override
    public List<ManagementLogDto> getManagementLogDtos(ManageFilterType filterType, int offset, int limit) {
        // 1. 별칭용 QAnime 추가 생성
        QAnime anime = QAnime.anime;
        QAnime epAnime = new QAnime("epAnime"); // 에피소드를 통한 애니 정보 별칭

        return queryFactory.select(
                        Projections.constructor(
                                ManagementLogDto.class,
                                adminActionLog.id,
                                anime.id.coalesce(epAnime.id),
                                episode.id,
                                adminActionLog.targetIpHash,
                                anime.titleKor.coalesce(epAnime.titleKor),
                                episode.episodeNumber,
                                week.id,
                                Projections.constructor(
                                        WeekDto.class,
                                        week.id,
                                        quarter.yearValue,
                                        quarter.quarterValue,
                                        week.weekValue,
                                        Expressions.as(
                                                Expressions.nullExpression(LocalDate.class),
                                                "startDate"
                                        ),
                                        Expressions.as(
                                                Expressions.nullExpression(LocalDate.class),
                                                "endDate"
                                        )
                                ),
                                adminActionLog.reason,
                                adminActionLog.isUndoable,
                                Projections.constructor(
                                        ManagerProfileDto.class,
                                        member.id,
                                        member.profileImageUrl,
                                        member.nickname,
                                        adminActionLog.adminTaskType,
                                        adminActionLog.createdAt
                                )
                        ))
                .from(adminActionLog)
                .join(adminActionLog.member, member)
                .leftJoin(adminActionLog.anime, anime)  // 직접 연관 조인
                .leftJoin(adminActionLog.episode, episode)
                .leftJoin(episode.anime, epAnime)  // 에피소드를 통한 애니메이션 조인
                .leftJoin(adminActionLog.week, week)
                .leftJoin(week.quarter, quarter)
                .where(eqFilterType(filterType))
                .orderBy(adminActionLog.createdAt.desc())
                .offset(offset)
                .limit(limit)
                .fetch();
    }

    private BooleanExpression eqFilterType(ManageFilterType filterType) {
        if (filterType == null || filterType == ManageFilterType.ALL) {
            return null;
        }
        return switch (filterType) {
            case ANIME -> adminActionLog.anime.id.isNotNull();
            case EPISODE -> adminActionLog.episode.id.isNotNull();
            case IP -> adminActionLog.targetIpHash.isNotNull();
            default -> null;
        };
    }
}
