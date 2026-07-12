-- 1) User table schema 

CREATE TABLE IF NOT EXISTS public.users
(
    user_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    full_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    email character varying(255) COLLATE pg_catalog."default" NOT NULL,
    password_hash text COLLATE pg_catalog."default" NOT NULL,
    phone character varying(15) COLLATE pg_catalog."default",
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    failed_login_attempts integer DEFAULT 0,
    CONSTRAINT users_pkey PRIMARY KEY (user_id),
    CONSTRAINT users_email_key UNIQUE (email)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users
    OWNER to postgres;
-- Index: idx_users_email

-- DROP INDEX IF EXISTS public.idx_users_email;

CREATE INDEX IF NOT EXISTS idx_users_email
    ON public.users USING btree
    (email COLLATE pg_catalog."default" ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;

-- 2)Vehicle Table Schema

CREATE TABLE IF NOT EXISTS public.vehicles
(
    vehicle_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    registration_number character varying(20) COLLATE pg_catalog."default" NOT NULL,
    vehicle_name character varying(100) COLLATE pg_catalog."default",
    manufacturer character varying(100) COLLATE pg_catalog."default",
    model character varying(100) COLLATE pg_catalog."default",
    vehicle_type character varying(50) COLLATE pg_catalog."default",
    maximum_load_capacity numeric(10,2),
    odometer numeric(10,2) DEFAULT 0,
    acquisition_cost numeric(12,2),
    purchase_date date,
    insurance_expiry date,
    registration_expiry date,
    status vehicle_status DEFAULT 'Available'::vehicle_status,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vehicles_pkey PRIMARY KEY (vehicle_id),
    CONSTRAINT vehicles_registration_number_key UNIQUE (registration_number),
    CONSTRAINT vehicles_maximum_load_capacity_check CHECK (maximum_load_capacity > 0::numeric),
    CONSTRAINT vehicles_odometer_check CHECK (odometer >= 0::numeric)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.vehicles
    OWNER to postgres;
-- Index: idx_vehicle_status

-- DROP INDEX IF EXISTS public.idx_vehicle_status;

CREATE INDEX IF NOT EXISTS idx_vehicle_status
    ON public.vehicles USING btree
    (status ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;

-- 3) user Session table 
CREATE TABLE IF NOT EXISTS public.user_sessions
(
    session_id bigint NOT NULL DEFAULT nextval('user_sessions_session_id_seq'::regclass),
    user_id uuid NOT NULL,
    jti text COLLATE pg_catalog."default" NOT NULL,
    refresh_token_hash text COLLATE pg_catalog."default" NOT NULL,
    ip_address text COLLATE pg_catalog."default",
    user_agent text COLLATE pg_catalog."default",
    expires_at timestamp with time zone NOT NULL,
    revoked boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id),
    CONSTRAINT user_sessions_jti_key UNIQUE (jti),
    CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.user_sessions
    OWNER to postgres;



-- 4) User roles table 

CREATE TABLE IF NOT EXISTS public.user_roles
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    CONSTRAINT user_roles_pkey PRIMARY KEY (id),
    CONSTRAINT user_roles_user_id_role_id_key UNIQUE (user_id, role_id),
    CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id)
        REFERENCES public.roles (role_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.user_roles
    OWNER to postgres;

-- 5) Trips table
CREATE TABLE IF NOT EXISTS public.trips
(
    trip_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    trip_number character varying(30) COLLATE pg_catalog."default" NOT NULL,
    vehicle_id uuid NOT NULL,
    driver_id uuid NOT NULL,
    created_by uuid,
    source character varying(200) COLLATE pg_catalog."default" NOT NULL,
    destination character varying(200) COLLATE pg_catalog."default" NOT NULL,
    planned_distance numeric(10,2),
    actual_distance numeric(10,2),
    cargo_weight numeric(10,2),
    trip_status trip_status DEFAULT 'Draft'::trip_status,
    dispatch_time timestamp without time zone,
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    initial_odometer numeric(10,2),
    final_odometer numeric(10,2),
    estimated_revenue numeric(12,2),
    actual_revenue numeric(12,2),
    remarks text COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT trips_pkey PRIMARY KEY (trip_id),
    CONSTRAINT trips_trip_number_key UNIQUE (trip_number),
    CONSTRAINT trips_created_by_fkey FOREIGN KEY (created_by)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT trips_driver_id_fkey FOREIGN KEY (driver_id)
        REFERENCES public.drivers (driver_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT trips_vehicle_id_fkey FOREIGN KEY (vehicle_id)
        REFERENCES public.vehicles (vehicle_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.trips
    OWNER to postgres;
-- Index: idx_trip_driver

-- DROP INDEX IF EXISTS public.idx_trip_driver;

CREATE INDEX IF NOT EXISTS idx_trip_driver
    ON public.trips USING btree
    (driver_id ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;
-- Index: idx_trip_status

-- DROP INDEX IF EXISTS public.idx_trip_status;

CREATE INDEX IF NOT EXISTS idx_trip_status
    ON public.trips USING btree
    (trip_status ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;
-- Index: idx_trip_vehicle

-- DROP INDEX IF EXISTS public.idx_trip_vehicle;

CREATE INDEX IF NOT EXISTS idx_trip_vehicle
    ON public.trips USING btree
    (vehicle_id ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;

-- Trigger: trg_check_vehicle_capacity

-- DROP TRIGGER IF EXISTS trg_check_vehicle_capacity ON public.trips;

CREATE OR REPLACE TRIGGER trg_check_vehicle_capacity
    BEFORE INSERT OR UPDATE 
    ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION public.check_vehicle_capacity();

-- Trigger: trg_vehicle_status

-- DROP TRIGGER IF EXISTS trg_vehicle_status ON public.trips;

CREATE OR REPLACE TRIGGER trg_vehicle_status
    AFTER UPDATE 
    ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION public.update_vehicle_status();


-- 6) Roles Table
CREATE TABLE IF NOT EXISTS public.roles
(
    role_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    role_name role_name NOT NULL,
    description text COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT roles_pkey PRIMARY KEY (role_id),
    CONSTRAINT roles_role_name_key UNIQUE (role_name)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.roles
    OWNER to postgres;

-- 7) Maintenance logs table

CREATE TABLE IF NOT EXISTS public.maintenance_logs
(
    maintenance_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    vehicle_id uuid NOT NULL,
    maintenance_type character varying(100) COLLATE pg_catalog."default",
    description text COLLATE pg_catalog."default",
    service_center character varying(200) COLLATE pg_catalog."default",
    cost numeric(12,2),
    start_date date,
    end_date date,
    status maintenance_status DEFAULT 'Open'::maintenance_status,
    next_service_due date,
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT maintenance_logs_pkey PRIMARY KEY (maintenance_id),
    CONSTRAINT maintenance_logs_created_by_fkey FOREIGN KEY (created_by)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT maintenance_logs_vehicle_id_fkey FOREIGN KEY (vehicle_id)
        REFERENCES public.vehicles (vehicle_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.maintenance_logs
    OWNER to postgres;
--  8) Login audit logs table

CREATE TABLE IF NOT EXISTS public.login_audit_logs
(
    audit_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    ip_address inet,
    user_agent text COLLATE pg_catalog."default",
    login_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    logout_time timestamp without time zone,
    refresh_token_jti uuid NOT NULL,
    is_active boolean DEFAULT true,
    refresh_token_hash text COLLATE pg_catalog."default" NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    revoked_at timestamp without time zone,
    CONSTRAINT login_audit_logs_pkey PRIMARY KEY (audit_id),
    CONSTRAINT login_audit_logs_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.login_audit_logs
    OWNER to postgres;
-- Index: idx_login_audit_logs_expires

-- DROP INDEX IF EXISTS public.idx_login_audit_logs_expires;

CREATE INDEX IF NOT EXISTS idx_login_audit_logs_expires
    ON public.login_audit_logs USING btree
    (expires_at ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;
-- Index: idx_login_audit_logs_jti

-- DROP INDEX IF EXISTS public.idx_login_audit_logs_jti;

CREATE INDEX IF NOT EXISTS idx_login_audit_logs_jti
    ON public.login_audit_logs USING btree
    (refresh_token_jti ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;
-- Index: idx_login_audit_logs_user_active

-- DROP INDEX IF EXISTS public.idx_login_audit_logs_user_active;

CREATE INDEX IF NOT EXISTS idx_login_audit_logs_user_active
    ON public.login_audit_logs USING btree
    (user_id ASC NULLS LAST, is_active ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;

-- Trigger: trg_login_audit_logs_updated_at

-- DROP TRIGGER IF EXISTS trg_login_audit_logs_updated_at ON public.login_audit_logs;

CREATE OR REPLACE TRIGGER trg_login_audit_logs_updated_at
    BEFORE UPDATE 
    ON public.login_audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

--  9) Fuel logs Table

CREATE TABLE IF NOT EXISTS public.fuel_logs
(
    fuel_log_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    vehicle_id uuid NOT NULL,
    trip_id uuid,
    fuel_station character varying(100) COLLATE pg_catalog."default",
    liters numeric(10,2),
    cost numeric(12,2),
    price_per_liter numeric(10,2),
    odometer numeric(10,2),
    fuel_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fuel_logs_pkey PRIMARY KEY (fuel_log_id),
    CONSTRAINT fuel_logs_trip_id_fkey FOREIGN KEY (trip_id)
        REFERENCES public.trips (trip_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fuel_logs_vehicle_id_fkey FOREIGN KEY (vehicle_id)
        REFERENCES public.vehicles (vehicle_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.fuel_logs
    OWNER to postgres;


--  10) expenses Table

CREATE TABLE IF NOT EXISTS public.expenses
(
    expense_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    vehicle_id uuid,
    trip_id uuid,
    expense_type expense_type,
    amount numeric(12,2),
    expense_date date,
    description text COLLATE pg_catalog."default",
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT expenses_pkey PRIMARY KEY (expense_id),
    CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT expenses_trip_id_fkey FOREIGN KEY (trip_id)
        REFERENCES public.trips (trip_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT expenses_vehicle_id_fkey FOREIGN KEY (vehicle_id)
        REFERENCES public.vehicles (vehicle_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.expenses
    OWNER to postgres;


-- 11) Drivers table

CREATE TABLE IF NOT EXISTS public.drivers
(
    driver_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid,
    employee_code character varying(20) COLLATE pg_catalog."default",
    full_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    license_number character varying(100) COLLATE pg_catalog."default" NOT NULL,
    license_category character varying(20) COLLATE pg_catalog."default",
    license_issue_date date,
    license_expiry_date date NOT NULL,
    contact_number character varying(15) COLLATE pg_catalog."default",
    address text COLLATE pg_catalog."default",
    date_of_birth date,
    joining_date date,
    safety_score numeric(5,2),
    status driver_status DEFAULT 'Available'::driver_status,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT drivers_pkey PRIMARY KEY (driver_id),
    CONSTRAINT drivers_employee_code_key UNIQUE (employee_code),
    CONSTRAINT drivers_license_number_key UNIQUE (license_number),
    CONSTRAINT drivers_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT drivers_safety_score_check CHECK (safety_score >= 0::numeric AND safety_score <= 100::numeric)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.drivers
    OWNER to postgres;
-- Index: idx_driver_status

-- DROP INDEX IF EXISTS public.idx_driver_status;

CREATE INDEX IF NOT EXISTS idx_driver_status
    ON public.drivers USING btree
    (status ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;