FROM quay.io/keycloak/keycloak:26.7.1 AS builder

# Build-time features
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true
ENV KC_DB=postgres

WORKDIR /opt/keycloak

RUN /opt/keycloak/bin/kc.sh build


FROM quay.io/keycloak/keycloak:26.7.1

COPY --from=builder /opt/keycloak/ /opt/keycloak/

# Bake the Nirka realm into the image
COPY infrastructure/keycloak/nirka-inventory-realm.json /opt/keycloak/data/import/nirka-inventory-realm.json

ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true
ENV KC_DB=postgres

ENTRYPOINT ["/bin/sh", "-c"]

CMD ["/opt/keycloak/bin/kc.sh bootstrap-admin user --username ${KC_BOOTSTRAP_ADMIN_USERNAME} --password ${KC_BOOTSTRAP_ADMIN_PASSWORD} || true && /opt/keycloak/bin/kc.sh start --optimized --http-enabled=true --proxy-headers=xforwarded --import-realm"]