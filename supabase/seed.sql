-- Insert dummy admin profile (requires matching auth.users entry in real usage, but good for foreign keys)
insert into profiles (user_id, role, display_name, age)
values
  ('00000000-0000-0000-0000-000000000000', 'admin', 'Admin User', 30)
on conflict do nothing;

-- Insert 3 published sessions
insert into sessions (id, title, theme, description, start_at, end_at, status, created_by)
values
  ('11111111-1111-1111-1111-111111111111', 'Space Habitat Challenge', 'Space', 'Design a habitat for Mars.', now() + interval ''1 day'', now() + interval ''2 days'', 'published', '00000000-0000-0000-0000-000000000000'),
  ('22222222-2222-2222-2222-222222222222', 'Underwater City', 'Ocean', 'Build a sustainable underwater city.', now() + interval ''3 days'', now() + interval ''4 days'', 'published', '00000000-0000-0000-0000-000000000000'),
  ('33333333-3333-3333-3333-333333333333', 'Robot Pet Rescue', 'Robotics', 'Create a robot to help find lost pets.', now() + interval ''5 days'', now() + interval ''6 days'', 'published', '00000000-0000-0000-0000-000000000000')
on conflict do nothing;
