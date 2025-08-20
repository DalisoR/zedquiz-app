-- Create error_logs table for centralized error tracking
create table if not exists error_logs (
    id uuid default uuid_generate_v4() primary key,
    level text not null,
    message text not null,
    error jsonb,
    context jsonb,
    timestamp timestamptz not null default now(),
    created_at timestamptz not null default now()
);

-- Create index on timestamp for better query performance
create index if not exists error_logs_timestamp_idx on error_logs (timestamp);

-- Create policy to allow only insert and select
create policy "Enable insert for authenticated users only" 
    on error_logs for insert 
    to authenticated 
    with check (true);

create policy "Enable select for super admins only" 
    on error_logs for select 
    to authenticated 
    using (
        exists (
            select 1 
            from profiles 
            where profiles.id = auth.uid() 
            and profiles.role = 'super-admin'
        )
    );
