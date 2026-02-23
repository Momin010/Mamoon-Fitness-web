-- Workout Plans Table
-- Stores user's personalized workout plans generated from onboarding

-- Workout Plans (the overall plan)
create table if not exists workout_plans (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    description text,
    experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced')),
    days_per_week integer default 3,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Workout Days (individual days within a plan)
create table if not exists workout_days (
    id uuid primary key default gen_random_uuid(),
    plan_id uuid references workout_plans(id) on delete cascade not null,
    day_number integer not null,
    name text not null,
    is_rest_day boolean default false,
    created_at timestamptz default now()
);

-- Plan Exercises (exercises within a day - for the planned workout)
-- Note: Using plan_exercises to avoid conflict with existing workout_exercises table
create table if not exists plan_exercises (
    id uuid primary key default gen_random_uuid(),
    day_id uuid references workout_days(id) on delete cascade not null,
    exercise_id text not null, -- References exercise ID from exercises.json
    exercise_name text not null,
    sets integer default 3,
    reps text default '8-12',
    rest_seconds integer default 90,
    order_index integer default 0,
    notes text,
    created_at timestamptz default now()
);

-- Exercise Set Logs (tracks individual sets within the existing workout_exercises)
create table if not exists exercise_set_logs (
    id uuid primary key default gen_random_uuid(),
    workout_exercise_id uuid references workout_exercises(id) on delete cascade not null,
    set_number integer not null,
    target_reps text,
    actual_reps integer,
    weight_kg decimal(5,2),
    completed boolean default false,
    completed_at timestamptz
);

-- Create indexes for better query performance
create index if not exists idx_workout_plans_user_id on workout_plans(user_id);
create index if not exists idx_workout_days_plan_id on workout_days(plan_id);
create index if not exists idx_plan_exercises_day_id on plan_exercises(day_id);
create index if not exists idx_exercise_set_logs_workout_exercise_id on exercise_set_logs(workout_exercise_id);

-- Enable RLS
alter table workout_plans enable row level security;
alter table workout_days enable row level security;
alter table plan_exercises enable row level security;
alter table exercise_set_logs enable row level security;

-- RLS Policies for workout_plans
create policy "Users can view their own workout plans"
    on workout_plans for select
    using (auth.uid() = user_id);

create policy "Users can insert their own workout plans"
    on workout_plans for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own workout plans"
    on workout_plans for update
    using (auth.uid() = user_id);

create policy "Users can delete their own workout plans"
    on workout_plans for delete
    using (auth.uid() = user_id);

-- RLS Policies for workout_days
create policy "Users can view workout days of their plans"
    on workout_days for select
    using (exists (
        select 1 from workout_plans
        where workout_plans.id = workout_days.plan_id
        and workout_plans.user_id = auth.uid()
    ));

create policy "Users can insert workout days to their plans"
    on workout_days for insert
    with check (exists (
        select 1 from workout_plans
        where workout_plans.id = workout_days.plan_id
        and workout_plans.user_id = auth.uid()
    ));

create policy "Users can update workout days of their plans"
    on workout_days for update
    using (exists (
        select 1 from workout_plans
        where workout_plans.id = workout_days.plan_id
        and workout_plans.user_id = auth.uid()
    ));

create policy "Users can delete workout days of their plans"
    on workout_days for delete
    using (exists (
        select 1 from workout_plans
        where workout_plans.id = workout_days.plan_id
        and workout_plans.user_id = auth.uid()
    ));

-- RLS Policies for plan_exercises
create policy "Users can view exercises of their workout days"
    on plan_exercises for select
    using (exists (
        select 1 from workout_days
        join workout_plans on workout_plans.id = workout_days.plan_id
        where workout_days.id = plan_exercises.day_id
        and workout_plans.user_id = auth.uid()
    ));

create policy "Users can insert exercises to their workout days"
    on plan_exercises for insert
    with check (exists (
        select 1 from workout_days
        join workout_plans on workout_plans.id = workout_days.plan_id
        where workout_days.id = plan_exercises.day_id
        and workout_plans.user_id = auth.uid()
    ));

create policy "Users can update exercises of their workout days"
    on plan_exercises for update
    using (exists (
        select 1 from workout_days
        join workout_plans on workout_plans.id = workout_days.plan_id
        where workout_days.id = plan_exercises.day_id
        and workout_plans.user_id = auth.uid()
    ));

create policy "Users can delete exercises from their workout days"
    on plan_exercises for delete
    using (exists (
        select 1 from workout_days
        join workout_plans on workout_plans.id = workout_days.plan_id
        where workout_days.id = plan_exercises.day_id
        and workout_plans.user_id = auth.uid()
    ));

-- RLS Policies for exercise_set_logs (extends existing workout_exercises)
create policy "Users can view set logs of their exercises"
    on exercise_set_logs for select
    using (exists (
        select 1 from workout_exercises
        join workout_sessions on workout_sessions.id = workout_exercises.workout_session_id
        where workout_exercises.id = exercise_set_logs.workout_exercise_id
        and workout_sessions.user_id = auth.uid()
    ));

create policy "Users can insert set logs to their exercises"
    on exercise_set_logs for insert
    with check (exists (
        select 1 from workout_exercises
        join workout_sessions on workout_sessions.id = workout_exercises.workout_session_id
        where workout_exercises.id = exercise_set_logs.workout_exercise_id
        and workout_sessions.user_id = auth.uid()
    ));

create policy "Users can update set logs of their exercises"
    on exercise_set_logs for update
    using (exists (
        select 1 from workout_exercises
        join workout_sessions on workout_sessions.id = workout_exercises.workout_session_id
        where workout_exercises.id = exercise_set_logs.workout_exercise_id
        and workout_sessions.user_id = auth.uid()
    ));
