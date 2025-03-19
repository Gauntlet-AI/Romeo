FROM postgres:17.4

# Add labels for better maintainability
LABEL maintainer="Reservation System"
LABEL description="PostgreSQL database for reservation system"
LABEL version="1.0"

# Environment variables for PostgreSQL configuration
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=romeo
ENV PGDATA=/var/lib/postgresql/data/pgdata

# Copy initialization SQL script
COPY schema.sql /docker-entrypoint-initdb.d/

# Set proper permissions for the init scripts
RUN chmod 0755 /docker-entrypoint-initdb.d/*

# Set healthcheck to verify database is up and running
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD pg_isready -U postgres -d romeo || exit 1

# Expose the default PostgreSQL port
EXPOSE 5432

# Optimize the PostgreSQL configuration for performance
# RUN echo "max_connections = 100" >> /usr/local/share/postgresql/postgresql.conf.sample && \
#     echo "shared_buffers = 128MB" >> /usr/local/share/postgresql/postgresql.conf.sample && \
#     echo "effective_cache_size = 512MB" >> /usr/local/share/postgresql/postgresql.conf.sample && \
#     echo "work_mem = 8MB" >> /usr/local/share/postgresql/postgresql.conf.sample && \
#     echo "maintenance_work_mem = 64MB" >> /usr/local/share/postgresql/postgresql.conf.sample && \
#     echo "random_page_cost = 1.1" >> /usr/local/share/postgresql/postgresql.conf.sample && \
#     echo "effective_io_concurrency = 200" >> /usr/local/share/postgresql/postgresql.conf.sample && \
#     echo "wal_buffers = 4MB" >> /usr/local/share/postgresql/postgresql.conf.sample && \
#     echo "min_wal_size = 1GB" >> /usr/local/share/postgresql/postgresql.conf.sample && \
#     echo "max_wal_size = 4GB" >> /usr/local/share/postgresql/postgresql.conf.sample && \
#     echo "default_statistics_target = 100" >> /usr/local/share/postgresql/postgresql.conf.sample && \
#     echo "logging_collector = on" >> /usr/local/share/postgresql/postgresql.conf.sample && \
#     echo "log_destination = 'stderr'" >> /usr/local/share/postgresql/postgresql.conf.sample && \
#     echo "log_directory = 'pg_log'" >> /usr/local/share/postgresql/postgresql.conf.sample && \
#     echo "log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'" >> /usr/local/share/postgresql/postgresql.conf.sample && \
#     echo "log_rotation_age = 1d" >> /usr/local/share/postgresql/postgresql.conf.sample && \
#     echo "log_rotation_size = 10MB" >> /usr/local/share/postgresql/postgresql.conf.sample

# Add volume for data persistence
VOLUME ["/var/lib/postgresql/data"] 