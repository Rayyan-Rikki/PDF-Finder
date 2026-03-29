do $$
begin
  update auth.users
  set
    encrypted_password = extensions.crypt('rayyan2013', extensions.gen_salt('bf')),
    updated_at = now()
  where email = 'admin@pdffinder.local';
end
$$;
