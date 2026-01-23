FROM public.ecr.aws/docker/library/eclipse-temurin:17-jdk-alpine
WORKDIR /app

# 1. 보안을 위한 실행 유저 추가 (alpine 기준)
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# 2. 빌드 아티팩트 복사
# (build/libs/ 안에 plain.jar가 같이 생성될 수 있으므로 명확히 지정)
COPY --chown=spring:spring build/libs/*-SNAPSHOT.jar app.jar

EXPOSE 8080
ENV TZ=Asia/Seoul

# 현재 인스턴스의 메모리 자원을 보호하기 위해 JVM 힙 메모리 제한
ENTRYPOINT ["java", \
            "-Duser.timezone=Asia/Seoul", \
            "-XX:+UseContainerSupport", \
            "-Xmx768M", \
            "-jar", "app.jar"]