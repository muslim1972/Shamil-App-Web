database password
muslim2791@2025


Database host :
host: db.vrsuvebfqubzejpmoqqe.supabase.co
port: 5432
database: postgres
user: postgres


Project name :
ShamilApp


Project ID :
vrsuvebfqubzejpmoqqe

project Url (notification) :
https://vrsuvebfqubzejpmoqqe.supabase.co/functions/v1/send-push-notification


project Url :
https://vrsuvebfqubzejpmoqqe.supabase.co


API Key anon public :
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyc3V2ZWJmcXViemVqcG1vcXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MjEzODIsImV4cCI6MjA3MDA5NzM4Mn0.Mn0GUTVR_FlXBlA2kDkns31wSysWxwG7u7DEWNdF08Q




service_role    secret :
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyc3V2ZWJmcXViemVqcG1vcXFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUyMTM4MiwiZXhwIjoyMDcwMDk3MzgyfQ.QaM0x1PIcPDUDTVvxEx9D-wiDaCZKxQUEcYIS-DhoQU



Legacy JWT secret :
6YaIcOggVeHMMBKDsOdoxaJ+QLogtjaEPPH+pKlfSqKI80PmB8/aoTbzgbtKKOZ2WxKjCXTanP26vk9/YSMYkA==




Access token expiry time :
٣٦٠٠       seconds



tables names :


conversations table

id          | No description              | uuid                     | uuid       | X
name        | No description              | character varying        | varchar    | ✓
is_group    | No description              | boolean                  | bool       | ✓
created_by  | No description              | uuid                     | uuid       | ✓
created_at  | No description              | timestamp with time zone | timestamptz| ✓
updated_at  | No description              | timestamp with time zone | timestamptz| ✓
type        | No description              | text                     | text       | X
participants| No description              | uuid[]                   | uuid[]     | ✓








hidden_messages table

user_id    | No description | uuid | uuid | X
message_id | No description | uuid | uuid | X





message_reads table

id         | No description              | uuid                     | uuid       | X
message_id | No description              | uuid                     | uuid       | ✓
user_id    | No description              | uuid                     | uuid       | ✓
read_at    | No description              | timestamp with time zone | timestamptz| ✓




messages table

id                   | No description              | uuid                     | uuid       | X
conversation_id      | No description              | uuid                     | uuid       | ✓
sender_id            | No description              | uuid                     | uuid       | ✓
content              | No description              | text                     | text       | ✓
message_type         | No description              | text                     | text       | ✓
file_url             | No description              | text                     | text       | X
file_name            | No description              | text                     | text       | X
file_size            | No description              | bigint                   | int8       | X
reply_to             | No description              | uuid                     | uuid       | X
is_edited            | No description              | boolean                  | bool       | ✓
is_deleted           | No description              | boolean                  | bool       | ✓
created_at           | No description              | timestamp with time zone | timestamptz| ✓
updated_at           | No description              | timestamp with time zone | timestamptz| ✓
is_hidden            | No description              | boolean                  | bool       | X
deleted_by           | No description              | uuid                     | uuid       | X
deleted_for_all      | No description              | boolean                  | bool       | X
file_metadata        | No description              | jsonb                    | jsonb      | X
forwarded_from_message_id | No description         | uuid                     | uuid       | X
caption              | No description              | text                     | text       | X
media_metadata       | No description              | jsonb                    | jsonb      | X





profiles table

Name       | Description     | Data Type                  | Format      | Nullable
-----------|-----------------|----------------------------|-------------|---------
id         | No description  | uuid                       | uuid        | X
username   | No description  | text                       | text        | ✓
updated_at | No description  | timestamp with time zone   | timestamptz | ✓






push_tokens table

id         | No description              | uuid                     | uuid        | X
user_id    | No description              | uuid                     | uuid        | X
token      | No description              | text                     | text        | X
created_at | No description              | timestamp with time zone | timestamptz | ✓




users table

id           | No description              | uuid                     | uuid        | X
username     | No description              | character varying        | varchar     | X
email        | No description              | character varying        | varchar     | X
password_hash| No description              | character varying        | varchar     | ✓
display_name | No description              | character varying        | varchar     | ✓
avatar_url   | No description              | text                     | text        | ✓
is_online    | No description              | boolean                  | bool        | ✓
last_seen    | No description              | timestamp with time zone | timestamptz | ✓
created_at   | No description              | timestamp with time zone | timestamptz | ✓
updated_at   | No description              | timestamp with time zone | timestamptz | ✓
push_token   | No description              | text                     | text        | ✓



user_conversation_settings table

user_id           uuid           Nill
conversation_id   uuid           Nill
is_archived       boolean        Nill




| الجدول               | عدد الأعمدة | الأعمدة                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| conversation_members | 9           | id (uuid), conversation_id (uuid), user_id (uuid), joined_at (timestamp with time zone), is_admin (boolean), is_hidden (boolean), is_archived (boolean), cleared_at (timestamp with time zone), last_read_at (timestamp with time zone)                                                                                                                                                                                                                       |
| conversations        | 7           | id (uuid), name (character varying), is_group (boolean), created_by (uuid), created_at (timestamp with time zone), updated_at (timestamp with time zone), type (text)                                                                                                                                                                                                                                                                                         |
| hidden_messages      | 2           | user_id (uuid), message_id (uuid)                                                                                                                                                                                                                                                                                                                                                                                                                             |
| message_reads        | 4           | id (uuid), message_id (uuid), user_id (uuid), read_at (timestamp with time zone)                                                                                                                                                                                                                                                                                                                                                                              |
| messages             | 20          | id (uuid), conversation_id (uuid), sender_id (uuid), content (text), message_type (text), file_url (text), file_name (text), file_size (bigint), reply_to (uuid), is_edited (boolean), is_deleted (boolean), created_at (timestamp with time zone), updated_at (timestamp with time zone), is_hidden (boolean), deleted_by (uuid), deleted_for_all (boolean), file_metadata (jsonb), forwarded_from_message_id (uuid), caption (text), media_metadata (jsonb) |
| profiles             | 3           | id (uuid), username (text), updated_at (timestamp with time zone)                                                                                                                                                                                                                                                                                                                                                                                             |
| push_tokens          | 4           | id (uuid), user_id (uuid), token (text), created_at (timestamp with time zone)                                                                                                                                                                                                                                                                                                                                                                                |
| users                | 11          | id (uuid), username (character varying), email (character varying), password_hash (character varying), display_name (character varying), avatar_url (text), is_online (boolean), last_seen (timestamp with time zone), created_at (timestamp with time zone), updated_at (timestamp with time zone), push_token (text)                                                                                                                


npx expo start --port 8083 --go --clear 
npx expo start --port 8081 --go --clear 
npx expo start -c 

-----------------------------------------------
اخر معلومات عن بنية قاعدة البيانات

| schemaname | tablename                  | indexname                                            | indexdef                                                                                                                                                                  |
| ---------- | -------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| auth       | audit_log_entries          | audit_log_entries_pkey                               | CREATE UNIQUE INDEX audit_log_entries_pkey ON auth.audit_log_entries USING btree (id)                                                                                     |
| auth       | audit_log_entries          | audit_logs_instance_id_idx                           | CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id)                                                                               |
| auth       | flow_state                 | flow_state_created_at_idx                            | CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC)                                                                                   |
| auth       | flow_state                 | flow_state_pkey                                      | CREATE UNIQUE INDEX flow_state_pkey ON auth.flow_state USING btree (id)                                                                                                   |
| auth       | flow_state                 | idx_auth_code                                        | CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code)                                                                                                     |
| auth       | flow_state                 | idx_user_id_auth_method                              | CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method)                                                                      |
| auth       | identities                 | identities_email_idx                                 | CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops)                                                                                 |
| auth       | identities                 | identities_pkey                                      | CREATE UNIQUE INDEX identities_pkey ON auth.identities USING btree (id)                                                                                                   |
| auth       | identities                 | identities_provider_id_provider_unique               | CREATE UNIQUE INDEX identities_provider_id_provider_unique ON auth.identities USING btree (provider_id, provider)                                                         |
| auth       | identities                 | identities_user_id_idx                               | CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id)                                                                                              |
| auth       | instances                  | instances_pkey                                       | CREATE UNIQUE INDEX instances_pkey ON auth.instances USING btree (id)                                                                                                     |
| auth       | mfa_amr_claims             | amr_id_pk                                            | CREATE UNIQUE INDEX amr_id_pk ON auth.mfa_amr_claims USING btree (id)                                                                                                     |
| auth       | mfa_amr_claims             | mfa_amr_claims_session_id_authentication_method_pkey | CREATE UNIQUE INDEX mfa_amr_claims_session_id_authentication_method_pkey ON auth.mfa_amr_claims USING btree (session_id, authentication_method)                           |
| auth       | mfa_challenges             | mfa_challenge_created_at_idx                         | CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC)                                                                            |
| auth       | mfa_challenges             | mfa_challenges_pkey                                  | CREATE UNIQUE INDEX mfa_challenges_pkey ON auth.mfa_challenges USING btree (id)                                                                                           |
| auth       | mfa_factors                | factor_id_created_at_idx                             | CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at)                                                                               |
| auth       | mfa_factors                | mfa_factors_last_challenged_at_key                   | CREATE UNIQUE INDEX mfa_factors_last_challenged_at_key ON auth.mfa_factors USING btree (last_challenged_at)                                                               |
| auth       | mfa_factors                | mfa_factors_pkey                                     | CREATE UNIQUE INDEX mfa_factors_pkey ON auth.mfa_factors USING btree (id)                                                                                                 |
| auth       | mfa_factors                | mfa_factors_user_friendly_name_unique                | CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text)      |
| auth       | mfa_factors                | mfa_factors_user_id_idx                              | CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id)                                                                                            |
| auth       | mfa_factors                | unique_phone_factor_per_user                         | CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone)                                                                         |
| auth       | one_time_tokens            | one_time_tokens_pkey                                 | CREATE UNIQUE INDEX one_time_tokens_pkey ON auth.one_time_tokens USING btree (id)                                                                                         |
| auth       | one_time_tokens            | one_time_tokens_relates_to_hash_idx                  | CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to)                                                                          |
| auth       | one_time_tokens            | one_time_tokens_token_hash_hash_idx                  | CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash)                                                                          |
| auth       | one_time_tokens            | one_time_tokens_user_id_token_type_key               | CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type)                                                      |
| auth       | refresh_tokens             | refresh_tokens_instance_id_idx                       | CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id)                                                                              |
| auth       | refresh_tokens             | refresh_tokens_instance_id_user_id_idx               | CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id)                                                             |
| auth       | refresh_tokens             | refresh_tokens_parent_idx                            | CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent)                                                                                        |
| auth       | refresh_tokens             | refresh_tokens_pkey                                  | CREATE UNIQUE INDEX refresh_tokens_pkey ON auth.refresh_tokens USING btree (id)                                                                                           |
| auth       | refresh_tokens             | refresh_tokens_session_id_revoked_idx                | CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked)                                                               |
| auth       | refresh_tokens             | refresh_tokens_token_unique                          | CREATE UNIQUE INDEX refresh_tokens_token_unique ON auth.refresh_tokens USING btree (token)                                                                                |
| auth       | refresh_tokens             | refresh_tokens_updated_at_idx                        | CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC)                                                                           |
| auth       | saml_providers             | saml_providers_entity_id_key                         | CREATE UNIQUE INDEX saml_providers_entity_id_key ON auth.saml_providers USING btree (entity_id)                                                                           |
| auth       | saml_providers             | saml_providers_pkey                                  | CREATE UNIQUE INDEX saml_providers_pkey ON auth.saml_providers USING btree (id)                                                                                           |
| auth       | saml_providers             | saml_providers_sso_provider_id_idx                   | CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id)                                                                      |
| auth       | saml_relay_states          | saml_relay_states_created_at_idx                     | CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC)                                                                     |
| auth       | saml_relay_states          | saml_relay_states_for_email_idx                      | CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email)                                                                            |
| auth       | saml_relay_states          | saml_relay_states_pkey                               | CREATE UNIQUE INDEX saml_relay_states_pkey ON auth.saml_relay_states USING btree (id)                                                                                     |
| auth       | saml_relay_states          | saml_relay_states_sso_provider_id_idx                | CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id)                                                                |
| auth       | schema_migrations          | schema_migrations_pkey                               | CREATE UNIQUE INDEX schema_migrations_pkey ON auth.schema_migrations USING btree (version)                                                                                |
| auth       | sessions                   | sessions_not_after_idx                               | CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC)                                                                                         |
| auth       | sessions                   | sessions_pkey                                        | CREATE UNIQUE INDEX sessions_pkey ON auth.sessions USING btree (id)                                                                                                       |
| auth       | sessions                   | sessions_user_id_idx                                 | CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id)                                                                                                  |
| auth       | sessions                   | user_id_created_at_idx                               | CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at)                                                                                    |
| auth       | sso_domains                | sso_domains_domain_idx                               | CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain))                                                                                |
| auth       | sso_domains                | sso_domains_pkey                                     | CREATE UNIQUE INDEX sso_domains_pkey ON auth.sso_domains USING btree (id)                                                                                                 |
| auth       | sso_domains                | sso_domains_sso_provider_id_idx                      | CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id)                                                                            |
| auth       | sso_providers              | sso_providers_pkey                                   | CREATE UNIQUE INDEX sso_providers_pkey ON auth.sso_providers USING btree (id)                                                                                             |
| auth       | sso_providers              | sso_providers_resource_id_idx                        | CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id))                                                                  |
| auth       | users                      | confirmation_token_idx                               | CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text)                         |
| auth       | users                      | email_change_token_current_idx                       | CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text) |
| auth       | users                      | email_change_token_new_idx                           | CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text)             |
| auth       | users                      | reauthentication_token_idx                           | CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text)             |
| auth       | users                      | recovery_token_idx                                   | CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text)                                     |
| auth       | users                      | users_email_partial_key                              | CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false)                                                                 |
| auth       | users                      | users_instance_id_email_idx                          | CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text))                                                                    |
| auth       | users                      | users_instance_id_idx                                | CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id)                                                                                                |
| auth       | users                      | users_is_anonymous_idx                               | CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous)                                                                                              |
| auth       | users                      | users_phone_key                                      | CREATE UNIQUE INDEX users_phone_key ON auth.users USING btree (phone)                                                                                                     |
| auth       | users                      | users_pkey                                           | CREATE UNIQUE INDEX users_pkey ON auth.users USING btree (id)                                                                                                             |
| net        | _http_response             | _http_response_created_idx                           | CREATE INDEX _http_response_created_idx ON net._http_response USING btree (created)                                                                                       |
| public     | conversation_members       | conversation_members_conversation_id_idx             | CREATE INDEX conversation_members_conversation_id_idx ON public.conversation_members USING btree (conversation_id)                                                        |
| public     | conversation_members       | conversation_members_conversation_id_user_id_key     | CREATE UNIQUE INDEX conversation_members_conversation_id_user_id_key ON public.conversation_members USING btree (conversation_id, user_id)                                |
| public     | conversation_members       | conversation_members_pkey                            | CREATE UNIQUE INDEX conversation_members_pkey ON public.conversation_members USING btree (id)                                                                             |
| public     | conversation_members       | conversation_members_user_id_idx                     | CREATE INDEX conversation_members_user_id_idx ON public.conversation_members USING btree (user_id)                                                                        |
| public     | conversations              | conversations_pkey                                   | CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id)                                                                                           |
| public     | conversations              | idx_conversations_participants                       | CREATE INDEX idx_conversations_participants ON public.conversations USING gin (participants)                                                                              |
| public     | hidden_messages            | hidden_messages_pkey                                 | CREATE UNIQUE INDEX hidden_messages_pkey ON public.hidden_messages USING btree (user_id, message_id)                                                                      |
| public     | message_reads              | message_reads_message_id_user_id_key                 | CREATE UNIQUE INDEX message_reads_message_id_user_id_key ON public.message_reads USING btree (message_id, user_id)                                                        |
| public     | message_reads              | message_reads_pkey                                   | CREATE UNIQUE INDEX message_reads_pkey ON public.message_reads USING btree (id)                                                                                           |
| public     | messages                   | idx_messages_conversation_id                         | CREATE INDEX idx_messages_conversation_id ON public.messages USING btree (conversation_id)                                                                                |
| public     | messages                   | idx_messages_created_at                              | CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at)                                                                                          |
| public     | messages                   | idx_messages_sender_id                               | CREATE INDEX idx_messages_sender_id ON public.messages USING btree (sender_id)                                                                                            |
| public     | messages                   | idx_messages_user_id                                 | CREATE INDEX idx_messages_user_id ON public.messages USING btree (user_id)                                                                                                |
| public     | messages                   | messages_conversation_id_idx                         | CREATE INDEX messages_conversation_id_idx ON public.messages USING btree (conversation_id)                                                                                |
| public     | messages                   | messages_created_at_idx                              | CREATE INDEX messages_created_at_idx ON public.messages USING btree (created_at)                                                                                          |
| public     | messages                   | messages_pkey                                        | CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id)                                                                                                     |
| public     | messages                   | messages_sender_id_idx                               | CREATE INDEX messages_sender_id_idx ON public.messages USING btree (sender_id)                                                                                            |
| public     | profiles                   | profiles_pkey                                        | CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)                                                                                                     |
| public     | push_tokens                | push_tokens_pkey                                     | CREATE UNIQUE INDEX push_tokens_pkey ON public.push_tokens USING btree (id)                                                                                               |
| public     | push_tokens                | push_tokens_token_key                                | CREATE UNIQUE INDEX push_tokens_token_key ON public.push_tokens USING btree (token)                                                                                       |
| public     | push_tokens                | push_tokens_user_id_idx                              | CREATE INDEX push_tokens_user_id_idx ON public.push_tokens USING btree (user_id)                                                                                          |
| public     | users                      | idx_users_email                                      | CREATE INDEX idx_users_email ON public.users USING btree (email)                                                                                                          |
| public     | users                      | idx_users_last_login                                 | CREATE INDEX idx_users_last_login ON public.users USING btree (last_login)                                                                                                |
| public     | users                      | users_email_unique                                   | CREATE UNIQUE INDEX users_email_unique ON public.users USING btree (email)                                                                                                |
| public     | users                      | users_pkey                                           | CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)                                                                                                           |
| public     | users                      | users_username_key                                   | CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username)                                                                                             |
| realtime   | messages                   | messages_pkey                                        | CREATE UNIQUE INDEX messages_pkey ON ONLY realtime.messages USING btree (id, inserted_at)                                                                                 |
| realtime   | messages_2025_08_06        | messages_2025_08_06_pkey                             | CREATE UNIQUE INDEX messages_2025_08_06_pkey ON realtime.messages_2025_08_06 USING btree (id, inserted_at)                                                                |
| realtime   | messages_2025_08_07        | messages_2025_08_07_pkey                             | CREATE UNIQUE INDEX messages_2025_08_07_pkey ON realtime.messages_2025_08_07 USING btree (id, inserted_at)                                                                |
| realtime   | messages_2025_08_08        | messages_2025_08_08_pkey                             | CREATE UNIQUE INDEX messages_2025_08_08_pkey ON realtime.messages_2025_08_08 USING btree (id, inserted_at)                                                                |
| realtime   | messages_2025_08_09        | messages_2025_08_09_pkey                             | CREATE UNIQUE INDEX messages_2025_08_09_pkey ON realtime.messages_2025_08_09 USING btree (id, inserted_at)                                                                |
| realtime   | messages_2025_08_10        | messages_2025_08_10_pkey                             | CREATE UNIQUE INDEX messages_2025_08_10_pkey ON realtime.messages_2025_08_10 USING btree (id, inserted_at)                                                                |
| realtime   | schema_migrations          | schema_migrations_pkey                               | CREATE UNIQUE INDEX schema_migrations_pkey ON realtime.schema_migrations USING btree (version)                                                                            |
| realtime   | subscription               | ix_realtime_subscription_entity                      | CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity)                                                                                |
| realtime   | subscription               | pk_subscription                                      | CREATE UNIQUE INDEX pk_subscription ON realtime.subscription USING btree (id)                                                                                             |
| realtime   | subscription               | subscription_subscription_id_entity_filters_key      | CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters)                               |
| storage    | buckets                    | bname                                                | CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name)                                                                                                           |
| storage    | buckets                    | buckets_pkey                                         | CREATE UNIQUE INDEX buckets_pkey ON storage.buckets USING btree (id)                                                                                                      |
| storage    | migrations                 | migrations_name_key                                  | CREATE UNIQUE INDEX migrations_name_key ON storage.migrations USING btree (name)                                                                                          |
| storage    | migrations                 | migrations_pkey                                      | CREATE UNIQUE INDEX migrations_pkey ON storage.migrations USING btree (id)                                                                                                |
| storage    | objects                    | bucketid_objname                                     | CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name)                                                                                     |
| storage    | objects                    | idx_objects_bucket_id_name                           | CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C")                                                                      |
| storage    | objects                    | name_prefix_search                                   | CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops)                                                                                    |
| storage    | objects                    | objects_pkey                                         | CREATE UNIQUE INDEX objects_pkey ON storage.objects USING btree (id)                                                                                                      |
| storage    | s3_multipart_uploads       | idx_multipart_uploads_list                           | CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at)                                                          |
| storage    | s3_multipart_uploads       | s3_multipart_uploads_pkey                            | CREATE UNIQUE INDEX s3_multipart_uploads_pkey ON storage.s3_multipart_uploads USING btree (id)                                                                            |
| storage    | s3_multipart_uploads_parts | s3_multipart_uploads_parts_pkey                      | CREATE UNIQUE INDEX s3_multipart_uploads_parts_pkey ON storage.s3_multipart_uploads_parts USING btree (id)                                                                |
| vault      | secrets                    | secrets_name_idx                                     | CREATE UNIQUE INDEX secrets_name_idx ON vault.secrets USING btree (name) WHERE (name IS NOT NULL)                                                                         |
| vault      | secrets                    | secrets_pkey                                         | CREATE UNIQUE INDEX secrets_pkey ON vault.secrets USING btree (id)                                                                                                        |