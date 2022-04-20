FROM registry.access.redhat.com/ubi8/go-toolset as builder
# As of now the last commit, not downloading the latest becuase the patch might not work
ARG COMMIT=83bf07dd99d23a5d6998490ec35240a4be895254

USER root
WORKDIR /peribolos
RUN curl -L https://github.com/kubernetes/test-infra/tarball/$COMMIT | tar -xz --strip-components=1
COPY peribolos.patch prow/cmd/peribolos
RUN cd prow/cmd/peribolos && \
patch -f -u main.go -i peribolos.patch && \
CGO_ENABLED=0 go build -o /usr/bin/peribolos

FROM registry.access.redhat.com/ubi8-micro

COPY --from=builder /usr/bin/peribolos /usr/bin/peribolos
