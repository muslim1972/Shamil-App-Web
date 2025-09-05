database password
muslim2791@2025

-------------------------------------
 My User ID: 43fbfe7a-51c8-49a7-9491-eff946189bbb
-------------------------------------

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



----------------------------------------------
الدوال الموجودة في قاعدة البيانات

| اسم الدالة                      | نوع الروتين | نوع البيانات المرجعة | لغة البرمجة |
| ------------------------------- | ----------- | -------------------- | ----------- |
| archive_conversation            | FUNCTION    | void                 | PLPGSQL     |
| clear_and_hide_conversation     | FUNCTION    | boolean              | PLPGSQL     |
| delete_conversation_for_all     | FUNCTION    | boolean              | PLPGSQL     |
| get_archived_conversations      | FUNCTION    | record               | PLPGSQL     |
| get_non_archived_conversations  | FUNCTION    | record               | PLPGSQL     |
| get_user_archived_conversations | FUNCTION    | record               | PLPGSQL     |
| unarchive_conversation          | FUNCTION    | void                 | PLPGSQL     |

----------------------------------------------

| المخطط (Schema) | اسم الجدول                 | اسم العمود             | الموقع | نوع البيانات                | الطول الأقصى | الدقة | المقياس | يمكن أن يكون NULL | القيمة الافتراضية                                  |
| --------------- | -------------------------- | ---------------------- | ------ | --------------------------- | ------------ | ----- | ------- | ----------------- | -------------------------------------------------- |
| auth            | audit_log_entries          | instance_id            | 1      | uuid                        | null         | null  | null    | YES               | null                                               |
| auth            | audit_log_entries          | id                     | 2      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | audit_log_entries          | payload                | 3      | json                        | null         | null  | null    | YES               | null                                               |
| auth            | audit_log_entries          | created_at             | 4      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | audit_log_entries          | ip_address             | 5      | character varying           | 64           | null  | null    | NO                | ''::character varying                              |
| auth            | flow_state                 | id                     | 1      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | flow_state                 | user_id                | 2      | uuid                        | null         | null  | null    | YES               | null                                               |
| auth            | flow_state                 | auth_code              | 3      | text                        | null         | null  | null    | NO                | null                                               |
| auth            | flow_state                 | code_challenge_method  | 4      | USER-DEFINED                | null         | null  | null    | NO                | null                                               |
| auth            | flow_state                 | code_challenge         | 5      | text                        | null         | null  | null    | NO                | null                                               |
| auth            | flow_state                 | provider_type          | 6      | text                        | null         | null  | null    | NO                | null                                               |
| auth            | flow_state                 | provider_access_token  | 7      | text                        | null         | null  | null    | YES               | null                                               |
| auth            | flow_state                 | provider_refresh_token | 8      | text                        | null         | null  | null    | YES               | null                                               |
| auth            | flow_state                 | created_at             | 9      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | flow_state                 | updated_at             | 10     | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | identities                 | provider_id            | 1      | text                        | null         | null  | null    | NO                | null                                               |
| auth            | identities                 | user_id                | 2      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | identities                 | identity_data          | 3      | jsonb                       | null         | null  | null    | NO                | null                                               |
| auth            | identities                 | provider               | 4      | text                        | null         | null  | null    | NO                | null                                               |
| auth            | identities                 | last_sign_in_at        | 5      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | identities                 | created_at             | 6      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | identities                 | updated_at             | 7      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | identities                 | email                  | 8      | text                        | null         | null  | null    | YES               | null                                               |
| auth            | identities                 | id                     | 9      | uuid                        | null         | null  | null    | NO                | gen_random_uuid()                                  |
| auth            | instances                  | id                     | 1      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | instances                  | uuid                   | 2      | uuid                        | null         | null  | null    | YES               | null                                               |
| auth            | instances                  | raw_base_config        | 3      | text                        | null         | null  | null    | YES               | null                                               |
| auth            | instances                  | created_at             | 4      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | instances                  | updated_at             | 5      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | mfa_amr_claims             | session_id             | 1      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | mfa_amr_claims             | created_at             | 2      | timestamp with time zone    | null         | null  | null    | NO                | null                                               |
| auth            | mfa_amr_claims             | updated_at             | 3      | timestamp with time zone    | null         | null  | null    | NO                | null                                               |
| auth            | mfa_amr_claims             | authentication_method  | 4      | text                        | null         | null  | null    | NO                | null                                               |
| auth            | mfa_amr_claims             | id                     | 5      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | mfa_challenges             | id                     | 1      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | mfa_challenges             | factor_id              | 2      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | mfa_challenges             | created_at             | 3      | timestamp with time zone    | null         | null  | null    | NO                | null                                               |
| auth            | mfa_challenges             | verified_at            | 4      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | mfa_challenges             | ip_address             | 5      | inet                        | null         | null  | null    | NO                | null                                               |
| auth            | mfa_challenges             | otp_code               | 6      | text                        | null         | null  | null    | YES               | null                                               |
| auth            | mfa_challenges             | web_authn_session_data | 7      | jsonb                       | null         | null  | null    | YES               | null                                               |
| auth            | mfa_factors                | id                     | 1      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | mfa_factors                | user_id                | 2      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | mfa_factors                | friendly_name          | 3      | text                        | null         | null  | null    | YES               | null                                               |
| auth            | mfa_factors                | factor_type            | 4      | USER-DEFINED                | null         | null  | null    | NO                | null                                               |
| auth            | mfa_factors                | status                 | 5      | USER-DEFINED                | null         | null  | null    | NO                | null                                               |
| auth            | mfa_factors                | created_at             | 6      | timestamp with time zone    | null         | null  | null    | NO                | null                                               |
| auth            | mfa_factors                | updated_at             | 7      | timestamp with time zone    | null         | null  | null    | NO                | null                                               |
| auth            | mfa_factors                | secret                 | 8      | text                        | null         | null  | null    | YES               | null                                               |
| auth            | mfa_factors                | phone                  | 9      | text                        | null         | null  | null    | YES               | null                                               |
| auth            | mfa_factors                | last_challenged_at     | 10     | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | one_time_tokens            | id                     | 1      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | one_time_tokens            | user_id                | 2      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | one_time_tokens            | token_type             | 3      | USER-DEFINED                | null         | null  | null    | NO                | null                                               |
| auth            | one_time_tokens            | token_hash             | 4      | text                        | null         | null  | null    | NO                | null                                               |
| auth            | one_time_tokens            | relates_to             | 5      | text                        | null         | null  | null    | NO                | null                                               |
| auth            | one_time_tokens            | created_at             | 6      | timestamp without time zone | null         | null  | null    | NO                | now()                                              |
| auth            | one_time_tokens            | updated_at             | 7      | timestamp without time zone | null         | null  | null    | NO                | now()                                              |
| auth            | refresh_tokens             | instance_id            | 1      | uuid                        | null         | null  | null    | YES               | null                                               |
| auth            | refresh_tokens             | id                     | 2      | bigint                      | null         | 64    | 0       | NO                | nextval('auth.refresh_tokens_id_seq'::regclass)    |
| auth            | refresh_tokens             | token                  | 3      | character varying           | 255          | null  | null    | YES               | null                                               |
| auth            | refresh_tokens             | user_id                | 4      | character varying           | 255          | null  | null    | YES               | null                                               |
| auth            | refresh_tokens             | revoked                | 5      | boolean                     | null         | null  | null    | YES               | null                                               |
| auth            | refresh_tokens             | created_at             | 6      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | refresh_tokens             | updated_at             | 7      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | refresh_tokens             | parent                 | 8      | character varying           | 255          | null  | null    | YES               | null                                               |
| auth            | refresh_tokens             | session_id             | 9      | uuid                        | null         | null  | null    | YES               | null                                               |
| auth            | saml_providers             | id                     | 1      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | saml_providers             | sso_provider_id        | 2      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | saml_providers             | entity_id              | 3      | text                        | null         | null  | null    | NO                | null                                               |
| auth            | saml_providers             | metadata_xml           | 4      | text                        | null         | null  | null    | NO                | null                                               |
| auth            | saml_providers             | metadata_url           | 5      | text                        | null         | null  | null    | YES               | null                                               |
| auth            | saml_providers             | attribute_mapping      | 6      | jsonb                       | null         | null  | null    | YES               | null                                               |
| auth            | saml_providers             | created_at             | 7      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | saml_providers             | updated_at             | 8      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | saml_providers             | name_id_format         | 9      | text                        | null         | null  | null    | YES               | null                                               |
| auth            | saml_relay_states          | id                     | 1      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | saml_relay_states          | sso_provider_id        | 2      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | saml_relay_states          | request_id             | 3      | text                        | null         | null  | null    | NO                | null                                               |
| auth            | saml_relay_states          | for_email              | 4      | text                        | null         | null  | null    | YES               | null                                               |
| auth            | saml_relay_states          | redirect_to            | 5      | text                        | null         | null  | null    | YES               | null                                               |
| auth            | saml_relay_states          | created_at             | 7      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | saml_relay_states          | updated_at             | 8      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | saml_relay_states          | flow_state_id          | 9      | uuid                        | null         | null  | null    | YES               | null                                               |
| auth            | schema_migrations          | version                | 1      | character varying           | 255          | null  | null    | NO                | null                                               |
| auth            | sessions                   | id                     | 1      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | sessions                   | user_id                | 2      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | sessions                   | created_at             | 3      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | sessions                   | updated_at             | 4      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | sessions                   | factor_id              | 5      | uuid                        | null         | null  | null    | YES               | null                                               |
| auth            | sessions                   | aal                    | 6      | USER-DEFINED                | null         | null  | null    | YES               | null                                               |
| auth            | sessions                   | not_after              | 7      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | sessions                   | refreshed_at           | 8      | timestamp without time zone | null         | null  | null    | YES               | null                                               |
| auth            | sessions                   | user_agent             | 9      | text                        | null         | null  | null    | YES               | null                                               |
| auth            | sessions                   | ip                     | 10     | inet                        | null         | null  | null    | YES               | null                                               |
| auth            | sso_domains                | id                     | 1      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | sso_domains                | sso_provider_id        | 2      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | sso_domains                | domain                 | 3      | text                        | null         | null  | null    | NO                | null                                               |
| auth            | sso_domains                | created_at             | 4      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | sso_domains                | updated_at             | 5      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | sso_providers              | id                     | 1      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | sso_providers              | resource_id            | 2      | text                        | null         | null  | null    | YES               | null                                               |
| auth            | sso_providers              | created_at             | 3      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | sso_providers              | updated_at             | 4      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | sso_providers              | disabled               | 5      | boolean                     | null         | null  | null    | YES               | null                                               |
| auth            | users                      | instance_id            | 1      | uuid                        | null         | null  | null    | YES               | null                                               |
| auth            | users                      | id                     | 2      | uuid                        | null         | null  | null    | NO                | null                                               |
| auth            | users                      | aud                    | 3      | character varying           | 255          | null  | null    | YES               | null                                               |
| auth            | users                      | role                   | 4      | character varying           | 255          | null  | null    | YES               | null                                               |
| auth            | users                      | email                  | 5      | character varying           | 255          | null  | null    | YES               | null                                               |
| auth            | users                      | encrypted_password     | 6      | character varying           | 255          | null  | null    | YES               | null                                               |
| auth            | users                      | email_confirmed_at     | 7      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | users                      | invited_at             | 8      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| auth            | users                      | confirmation_token     | 9      | character varying           | 255          | null  | null    | YES               | null                                               |
| auth            | users                      | confirmation_sent_at   | 10     | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| net             | _http_response             | id                     | 1      | bigint                      | null         | 64    | 0       | YES               | null                                               |
| net             | _http_response             | status_code            | 2      | integer                     | null         | 32    | 0       | YES               | null                                               |
| net             | _http_response             | content_type           | 3      | text                        | null         | null  | null    | YES               | null                                               |
| net             | _http_response             | headers                | 4      | jsonb                       | null         | null  | null    | YES               | null                                               |
| net             | _http_response             | content                | 5      | text                        | null         | null  | null    | YES               | null                                               |
| net             | _http_response             | timed_out              | 6      | boolean                     | null         | null  | null    | YES               | null                                               |
| net             | _http_response             | error_msg              | 7      | text                        | null         | null  | null    | YES               | null                                               |
| net             | _http_response             | created                | 8      | timestamp with time zone    | null         | null  | null    | NO                | now()                                              |
| net             | http_request_queue         | id                     | 1      | bigint                      | null         | 64    | 0       | NO                | nextval('net.http_request_queue_id_seq'::regclass) |
| net             | http_request_queue         | method                 | 2      | text                        | null         | null  | null    | NO                | null                                               |
| net             | http_request_queue         | url                    | 3      | text                        | null         | null  | null    | NO                | null                                               |
| net             | http_request_queue         | headers                | 4      | jsonb                       | null         | null  | null    | NO                | null                                               |
| net             | http_request_queue         | body                   | 5      | bytea                       | null         | null  | null    | YES               | null                                               |
| net             | http_request_queue         | timeout_milliseconds   | 6      | integer                     | null         | 32    | 0       | NO                | null                                               |
| public          | conversations              | id                     | 1      | uuid                        | null         | null  | null    | NO                | uuid_generate_v4()                                 |
| public          | conversations              | name                   | 2      | character varying           | 255          | null  | null    | YES               | null                                               |
| public          | conversations              | is_group               | 3      | boolean                     | null         | null  | null    | YES               | false                                              |
| public          | conversations              | created_by             | 4      | uuid                        | null         | null  | null    | YES               | null                                               |
| public          | conversations              | created_at             | 5      | timestamp with time zone    | null         | null  | null    | YES               | now()                                              |
| public          | conversations              | updated_at             | 6      | timestamp with time zone    | null         | null  | null    | YES               | now()                                              |
| public          | conversations              | type                   | 7      | text                        | null         | null  | null    | YES               | null                                               |
| public          | conversations              | user_id                | 8      | uuid                        | null         | null  | null    | YES               | null                                               |
| public          | conversations              | participants           | 9      | ARRAY                       | null         | null  | null    | NO                | '{}'::uuid[]                                       |
| public          | hidden_messages            | user_id                | 1      | uuid                        | null         | null  | null    | NO                | null                                               |
| public          | hidden_messages            | message_id             | 2      | uuid                        | null         | null  | null    | NO                | null                                               |
| public          | message_reads              | id                     | 1      | uuid                        | null         | null  | null    | NO                | uuid_generate_v4()                                 |
| public          | message_reads              | message_id             | 2      | uuid                        | null         | null  | null    | YES               | null                                               |
| public          | message_reads              | user_id                | 3      | uuid                        | null         | null  | null    | YES               | null                                               |
| public          | message_reads              | read_at                | 4      | timestamp with time zone    | null         | null  | null    | YES               | now()                                              |
| public          | messages                   | id                     | 1      | uuid                        | null         | null  | null    | NO                | uuid_generate_v4()                                 |
| public          | messages                   | conversation_id        | 2      | uuid                        | null         | null  | null    | YES               | null                                               |
| public          | messages                   | sender_id              | 3      | uuid                        | null         | null  | null    | YES               | null                                               |
| public          | messages                   | content                | 4      | text                        | null         | null  | null    | NO                | null                                               |
| public          | messages                   | message_type           | 5      | text                        | null         | null  | null    | NO                | null                                               |
| public          | messages                   | file_url               | 6      | text                        | null         | null  | null    | YES               | null                                               |
| public          | messages                   | file_name              | 7      | text                        | null         | null  | null    | YES               | null                                               |
| public          | messages                   | file_size              | 8      | bigint                      | null         | 64    | 0       | YES               | null                                               |
| public          | messages                   | reply_to               | 9      | uuid                        | null         | null  | null    | YES               | null                                               |
| public          | messages                   | is_edited              | 10     | boolean                     | null         | null  | null    | YES               | false                                              |
| public          | profiles                   | id                     | 1      | uuid                        | null         | null  | null    | NO                | null                                               |
| public          | profiles                   | username               | 2      | text                        | null         | null  | null    | YES               | null                                               |
| public          | profiles                   | updated_at             | 3      | timestamp with time zone    | null         | null  | null    | NO                | now()                                              |
| public          | push_tokens                | id                     | 1      | uuid                        | null         | null  | null    | NO                | uuid_generate_v4()                                 |
| public          | push_tokens                | user_id                | 2      | uuid                        | null         | null  | null    | YES               | null                                               |
| public          | push_tokens                | token                  | 3      | text                        | null         | null  | null    | NO                | null                                               |
| public          | push_tokens                | created_at             | 4      | timestamp with time zone    | null         | null  | null    | YES               | now()                                              |
| public          | user_conversation_settings | user_id                | 1      | uuid                        | null         | null  | null    | NO                | null                                               |
| public          | user_conversation_settings | conversation_id        | 2      | uuid                        | null         | null  | null    | NO                | null                                               |
| public          | user_conversation_settings | is_archived            | 3      | boolean                     | null         | null  | null    | YES               | false                                              |
| public          | user_conversation_settings | archived_at            | 4      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| public          | users                      | id                     | 1      | uuid                        | null         | null  | null    | NO                | uuid_generate_v4()                                 |
| public          | users                      | username               | 2      | character varying           | 255          | null  | null    | NO                | null                                               |
| public          | users                      | email                  | 3      | character varying           | 255          | null  | null    | NO                | null                                               |
| public          | users                      | password_hash          | 4      | character varying           | 255          | null  | null    | YES               | null                                               |
| public          | users                      | display_name           | 5      | character varying           | 255          | null  | null    | YES               | null                                               |
| public          | users                      | avatar_url             | 6      | text                        | null         | null  | null    | YES               | null                                               |
| public          | users                      | is_online              | 7      | boolean                     | null         | null  | null    | YES               | false                                              |
| public          | users                      | last_seen              | 8      | timestamp with time zone    | null         | null  | null    | YES               | null                                               |
| public          | users                      | created_at             | 9      | timestamp with time zone    | null         | null  | null    | YES               | now()                                              |
| public          | users                      | updated_at             | 10     | timestamp with time zone    | null         | null  | null    | YES               | now()                                              |
| realtime        | messages                   | topic                  | 3      | text                        | null         | null  | null    | NO                | null                                               |
| realtime        | messages                   | extension              | 4      | text                        | null         | null  | null    | NO                | null                                               |
| realtime        | messages                   | payload                | 5      | jsonb                       | null         | null  | null    | YES               | null                                               |
| realtime        | messages                   | event                  | 6      | text                        | null         | null  | null    | YES               | null                                               |
| realtime        | messages                   | private                | 7      | boolean                     | null         | null  | null    | YES               | false                                              |
| realtime        | messages                   | updated_at             | 8      | timestamp without time zone | null         | null  | null    | NO                | now()                                              |
| realtime        | messages                   | inserted_at            | 9      | timestamp without time zone | null         | null  | null    | NO                | now()                                              |
| realtime        | messages                   | id                     | 10     | uuid                        | null         | null  | null    | NO                | gen_random_uuid()                                  |
| realtime        | messages_2025_08_22        | topic                  | 1      | text                        | null         | null  | null    | NO                | null                                               |
| realtime        | messages_2025_08_22        | extension              | 2      | text                        | null         | null  | null    | NO                | null                                               |
| realtime        | messages_2025_08_22        | payload                | 3      | jsonb                       | null         | null  | null    | YES               | null                                               |
| realtime        | messages_2025_08_22        | event                  | 4      | text                        | null         | null  | null    | YES               | null                                               |
| realtime        | messages_2025_08_22        | private                | 5      | boolean                     | null         | null  | null    | YES               | false                                              |
| realtime        | messages_2025_08_22        | updated_at             | 6      | timestamp without time zone | null         | null  | null    | NO                | now()                                              |
| realtime        | messages_2025_08_22        | inserted_at            | 7      | timestamp without time zone | null         | null  | null    | NO                | now()                                              |
| realtime        | messages_2025_08_22        | id                     | 8      | uuid                        | null         | null  | null    | NO                | gen_random_uuid()                                  |
| realtime        | messages_2025_08_23        | topic                  | 1      | text                        | null         | null  | null    | NO                | null                                               |
| realtime        | messages_2025_08_23        | extension              | 2      | text                        | null         | null  | null    | NO                | null                                               |
| realtime        | messages_2025_08_23        | payload                | 3      | jsonb                       | null         | null  | null    | YES               | null                                               |
| realtime        | messages_2025_08_23        | event                  | 4      | text                        | null         | null  | null    | YES               | null                                               |
| realtime        | messages_2025_08_23        | private                | 5      | boolean                     | null         | null  | null    | YES               | false                                              |
| realtime        | messages_2025_08_23        | updated_at             | 6      | timestamp without time zone | null         | null  | null    | NO                | now()                                              |
| realtime        | messages_2025_08_23        | inserted_at            | 7      | timestamp without time zone | null         | null  | null    | NO                | now()                                              |
| realtime        | messages_2025_08_23        | id                     | 8      | uuid                        | null         | null  | null    | NO                | gen_random_uuid()                                  |
| realtime        | messages_2025_08_24        | topic                  | 1      | text                        | null         | null  | null    | NO                | null                                               |
| realtime        | messages_2025_08_24        | extension              | 2      | text                        | null         | null  | null    | NO                | null                                               |
| realtime        | messages_2025_08_24        | payload                | 3      | jsonb                       | null         | null  | null    | YES               | null                                               |
| realtime        | messages_2025_08_24        | event                  | 4      | text                        | null         | null  | null    | YES               | null                                               |
| realtime        | messages_2025_08_24        | private                | 5      | boolean                     | null         | null  | null    | YES               | false                                              |
| realtime        | messages_2025_08_24        | updated_at             | 6      | timestamp without time zone | null         | null  | null    | NO                | now()                                              |
| realtime        | messages_2025_08_24        | inserted_at            | 7      | timestamp without time zone | null         | null  | null    | NO                | now()                                              |
| realtime        | messages_2025_08_24        | id                     | 8      | uuid                        | null         | null  | null    | NO                | gen_random_uuid()                                  |
| realtime        | messages_2025_08_25        | topic                  | 1      | text                        | null         | null  | null    | NO                | null                                               |
| realtime        | messages_2025_08_25        | extension              | 2      | text                        | null         | null  | null    | NO                | null                                               |
| realtime        | messages_2025_08_25        | payload                | 3      | jsonb                       | null         | null  | null    | YES               | null                                               |
| realtime        | messages_2025_08_25        | event                  | 4      | text                        | null         | null  | null    | YES               | null                                               |
| realtime        | messages_2025_08_25        | private                | 5      | boolean                     | null         | null  | null    | YES               | false                                              |
| realtime        | messages_2025_08_25        | updated_at             | 6      | timestamp without time zone | null         | null  | null    | NO                | now()                                              |
| realtime        | messages_2025_08_25        | inserted_at            | 7      | timestamp without time zone | null         | null  | null    | NO                | now()                                              |
| realtime        | messages_2025_08_25        | id                     | 8      | uuid                        | null         | null  | null    | NO                | gen_random_uuid()                                  |
| realtime        | messages_2025_08_26        | topic                  | 1      | text                        | null         | null  | null    | NO                | null                                               |
| realtime        | messages_2025_08_26        | extension              | 2      | text                        | null         | null  | null    | NO                | null                                               |
| realtime        | messages_2025_08_26        | payload                | 3      | jsonb                       | null         | null  | null    | YES               | null                                               |
| realtime        | messages_2025_08_26        | event                  | 4      | text                        | null         | null  | null    | YES               | null                                               |
| realtime        | messages_2025_08_26        | private                | 5      | boolean                     | null         | null  | null    | YES               | false                                              |
| realtime        | messages_2025_08_26        | updated_at             | 6      | timestamp without time zone | null         | null  | null    | NO                | now()                                              |
| realtime        | messages_2025_08_26        | inserted_at            | 7      | timestamp without time zone | null         | null  | null    | NO                | now()                                              |
| realtime        | messages_2025_08_26        | id                     | 8      | uuid                        | null         | null  | null    | NO                | gen_random_uuid()                                  |
| realtime        | schema_migrations          | version                | 1      | bigint                      | null         | 64    | 0       | NO                | null                                               |
| realtime        | schema_migrations          | inserted_at            | 2      | timestamp without time zone | null         | null  | null    | YES               | null                                               |
| realtime        | subscription               | id                     | 1      | bigint                      | null         | 64    | 0       | NO                | null                                               |
| realtime        | subscription               | subscription_id        | 2      | uuid                        | null         | null  | null    | NO                | null                                               |
| realtime        | subscription               | entity                 | 4      | regclass                    | null         | null  | null    | NO                | null                                               |
| realtime        | subscription               | filters                | 5      | ARRAY                       | null         | null  | null    | NO                | '{}'::realtime.user_defined_filter[]               |
| realtime        | subscription               | claims                 | 7      | jsonb                       | null         | null  | null    | NO                | null                                               |
| realtime        | subscription               | claims_role            | 8      | regrole                     | null         | null  | null    | NO                | null                                               |
| realtime        | subscription               | created_at             | 9      | timestamp without time zone | null         | null  | null    | NO                | timezone('utc'::text, now())                       |
| storage         | buckets                    | id                     | 1      | text                        | null         | null  | null    | NO                | null                                               |
| storage         | buckets                    | name                   | 2      | text                        | null         | null  | null    | NO                | null                                               |
| storage         | buckets                    | owner                  | 3      | uuid                        | null         | null  | null    | YES               | null                                               |
| storage         | buckets                    | created_at             | 4      | timestamp with time zone    | null         | null  | null    | YES               | now()                                              |
| storage         | buckets                    | updated_at             | 5      | timestamp with time zone    | null         | null  | null    | YES               | now()                                              |
| storage         | buckets                    | public                 | 6      | boolean                     | null         | null  | null    | YES               | false                                              |
| storage         | buckets                    | avif_autodetection     | 7      | boolean                     | null         | null  | null    | YES               | false                                              |
| storage         | buckets                    | file_size_limit        | 8      | bigint                      | null         | 64    | 0       | YES               | null                                               |
| storage         | buckets                    | allowed_mime_types     | 9      | ARRAY                       | null         | null  | null    | YES               | null                                               |
| storage         | buckets                    | owner_id               | 10     | text                        | null         | null  | null    | YES               | null                                               |
| storage         | buckets_analytics          | id                     | 1      | text                        | null         | null  | null    | NO                | null                                               |
| storage         | buckets_analytics          | type                   | 2      | USER-DEFINED                | null         | null  | null    | NO                | 'ANALYTICS'::storage.buckettype                    |
| storage         | buckets_analytics          | format                 | 3      | text                        | null         | null  | null    | NO                | 'ICEBERG'::text                                    |
| storage         | buckets_analytics          | created_at             | 4      | timestamp with time zone    | null         | null  | null    | NO                | now()                                              |
| storage         | buckets_analytics          | updated_at             | 5      | timestamp with time zone    | null         | null  | null    | NO                | now()                                              |
| storage         | migrations                 | id                     | 1      | integer                     | null         | 32    | 0       | NO                | null                                               |
| storage         | migrations                 | name                   | 2      | character varying           | 100          | null  | null    | NO                | null                                               |
| storage         | migrations                 | hash                   | 3      | character varying           | 40           | null  | null    | NO                | null                                               |
| storage         | migrations                 | executed_at            | 4      | timestamp without time zone | null         | null  | null    | YES               | CURRENT_TIMESTAMP                                  |
| storage         | objects                    | id                     | 1      | uuid                        | null         | null  | null    | NO                | gen_random_uuid()                                  |
| storage         | objects                    | bucket_id              | 2      | text                        | null         | null  | null    | YES               | null                                               |
| storage         | objects                    | name                   | 3      | text                        | null         | null  | null    | YES               | null                                               |
| storage         | objects                    | owner                  | 4      | uuid                        | null         | null  | null    | YES               | null                                               |
| storage         | objects                    | created_at             | 5      | timestamp with time zone    | null         | null  | null    | YES               | now()                                              |
| storage         | objects                    | updated_at             | 6      | timestamp with time zone    | null         | null  | null    | YES               | now()                                              |
| storage         | objects                    | last_accessed_at       | 7      | timestamp with time zone    | null         | null  | null    | YES               | now()                                              |
| storage         | objects                    | metadata               | 8      | jsonb                       | null         | null  | null    | YES               | null                                               |
| storage         | objects                    | path_tokens            | 9      | ARRAY                       | null         | null  | null    | YES               | null                                               |
| storage         | objects                    | version                | 10     | text                        | null         | null  | null    | YES               | null                                               |
| storage         | prefixes                   | bucket_id              | 1      | text                        | null         | null  | null    | NO                | null                                               |
| storage         | prefixes                   | name                   | 2      | text                        | null         | null  | null    | NO                | null                                               |
| storage         | prefixes                   | level                  | 3      | integer                     | null         | 32    | 0       | NO                | null                                               |
| storage         | prefixes                   | created_at             | 4      | timestamp with time zone    | null         | null  | null    | YES               | now()                                              |
| storage         | prefixes                   | updated_at             | 5      | timestamp with time zone    | null         | null  | null    | YES               | now()                                              |
| storage         | s3_multipart_uploads       | id                     | 1      | text                        | null         | null  | null    | NO                | null                                               |
| storage         | s3_multipart_uploads       | in_progress_size       | 2      | bigint                      | null         | 64    | 0       | NO                | 0                                                  |
| storage         | s3_multipart_uploads       | upload_signature       | 3      | text                        | null         | null  | null    | NO                | null                                               |
| storage         | s3_multipart_uploads       | bucket_id              | 4      | text                        | null         | null  | null    | NO                | null                                               |
| storage         | s3_multipart_uploads       | key                    | 5      | text                        | null         | null  | null    | NO                | null                                               |
| storage         | s3_multipart_uploads       | version                | 6      | text                        | null         | null  | null    | NO                | null                                               |
| storage         | s3_multipart_uploads       | owner_id               | 7      | text                        | null         | null  | null    | YES               | null                                               |
| storage         | s3_multipart_uploads       | created_at             | 8      | timestamp with time zone    | null         | null  | null    | NO                | now()                                              |
| storage         | s3_multipart_uploads       | user_metadata          | 9      | jsonb                       | null         | null  | null    | YES               | null                                               |
| storage         | s3_multipart_uploads_parts | id                     | 1      | uuid                        | null         | null  | null    | NO                | gen_random_uuid()                                  |
| storage         | s3_multipart_uploads_parts | upload_id              | 2      | text                        | null         | null  | null    | NO                | null                                               |
| storage         | s3_multipart_uploads_parts | size                   | 3      | bigint                      | null         | 64    | 0       | NO                | 0                                                  |
| storage         | s3_multipart_uploads_parts | part_number            | 4      | integer                     | null         | 32    | 0       | NO                | null                                               |
| storage         | s3_multipart_uploads_parts | bucket_id              | 5      | text                        | null         | null  | null    | NO                | null                                               |
| storage         | s3_multipart_uploads_parts | key                    | 6      | text                        | null         | null  | null    | NO                | null                                               |
| storage         | s3_multipart_uploads_parts | etag                   | 7      | text                        | null         | null  | null    | NO                | null                                               |
| storage         | s3_multipart_uploads_parts | owner_id               | 8      | text                        | null         | null  | null    | YES               | null                                               |
| storage         | s3_multipart_uploads_parts | version                | 9      | text                        | null         | null  | null    | NO                | null                                               |
| storage         | s3_multipart_uploads_parts | created_at             | 10     | timestamp with time zone    | null         | null  | null    | NO                | now()                                              |
| vault           | secrets                    | id                     | 1      | uuid                        | null         | null  | null    | NO                | gen_random_uuid()                                  |
| vault           | secrets                    | name                   | 2      | text                        | null         | null  | null    | YES               | null                                               |
| vault           | secrets                    | description            | 3      | text                        | null         | null  | null    | NO                | ''::text                                           |
| vault           | secrets                    | secret                 | 4      | text                        | null         | null  | null    | NO                | null                                               |
| vault           | secrets                    | key_id                 | 5      | uuid                        | null         | null  | null    | YES               | null                                               |
| vault           | secrets                    | nonce                  | 6      | bytea                       | null         | null  | null    | YES               | vault._crypto_aead_det_noncegen()                  |
| vault           | secrets                    | created_at             | 7      | timestamp with time zone    | null         | null  | null    | NO                | CURRENT_TIMESTAMP                                  |
| vault           | secrets                    | updated_at             | 8      | timestamp with time zone    | null         | null  | null    | NO                | CURRENT_TIMESTAMP                                  |






| المخطط (Schema) | اسم الجدول المصدر          | عمود المفتاح الأجنبي      | المخطط الهدف | اسم الجدول الهدف | عمود المفتاح الهدف | اسم القيد                                       |
| --------------- | -------------------------- | ------------------------- | ------------ | ---------------- | ------------------ | ----------------------------------------------- |
| public          | conversations              | created_by                | public       | users            | id                 | conversations_created_by_fkey                   |
| public          | conversations              | user_id                   | public       | users            | id                 | conversations_user_id_fkey                      |
| public          | hidden_messages            | message_id                | public       | messages         | id                 | hidden_messages_message_id_fkey                 |
| public          | hidden_messages            | user_id                   | public       | users            | id                 | hidden_messages_user_id_fkey                    |
| public          | message_reads              | message_id                | public       | messages         | id                 | message_reads_message_id_fkey                   |
| public          | message_reads              | user_id                   | public       | users            | id                 | message_reads_user_id_fkey                      |
| public          | messages                   | conversation_id           | public       | conversations    | id                 | messages_conversation_id_fkey                   |
| public          | messages                   | deleted_by                | public       | users            | id                 | messages_deleted_by_fkey                        |
| public          | messages                   | forwarded_from_message_id | public       | messages         | id                 | messages_forwarded_from_message_id_fkey         |
| public          | messages                   | reply_to                  | public       | messages         | id                 | messages_reply_to_fkey                          |
| public          | messages                   | sender_id                 | public       | users            | id                 | messages_sender_id_fkey                         |
| public          | push_tokens                | user_id                   | public       | users            | id                 | push_tokens_user_id_fkey                        |
| public          | user_conversation_settings | conversation_id           | public       | conversations    | id                 | user_conversation_settings_conversation_id_fkey |
| public          | user_conversation_settings | user_id                   | public       | users            | id                 | user_conversation_settings_user_id_fkey         |





| المخطط (Schema) | اسم الجدول     | اسم القيد                                            | اسم العمود            |
| --------------- | -------------- | ---------------------------------------------------- | --------------------- |
| auth            | identities     | identities_provider_id_provider_unique               | provider_id           |
| auth            | identities     | identities_provider_id_provider_unique               | provider              |
| auth            | mfa_amr_claims | mfa_amr_claims_session_id_authentication_method_pkey | session_id            |
| auth            | mfa_amr_claims | mfa_amr_claims_session_id_authentication_method_pkey | authentication_method |
| auth            | mfa_factors    | mfa_factors_last_challenged_at_key                   | last_challenged_at    |
| auth            | refresh_tokens | refresh_tokens_token_unique                          | token                 |
| auth            | saml_providers | saml_providers_entity_id_key                         | entity_id             |
| auth            | users          | users_phone_key                                      | phone                 |
| public          | message_reads  | message_reads_message_id_user_id_key                 | message_id            |
| public          | message_reads  | message_reads_message_id_user_id_key                 | user_id               |
| public          | push_tokens    | push_tokens_token_key                                | token                 |
| public          | users          | users_email_unique                                   | email                 |
| public          | users          | users_username_key                                   | username              |










------------------------------------------------------------------------------------------------------------------------------------------------------

| المخطط (Schema) | اسم الجدول المصدر          | عمود المفتاح الأجنبي      | الجدول الهدف  | عمود المفتاح الهدف | اسم القيد                                       |
| --------------- | -------------------------- | ------------------------- | ------------- | ------------------ | ----------------------------------------------- |
| public          | conversations              | created_by                | users         | id                 | conversations_created_by_fkey                   |
| public          | conversations              | user_id                   | users         | id                 | conversations_user_id_fkey                      |
| public          | hidden_messages            | message_id                | messages      | id                 | hidden_messages_message_id_fkey                 |
| public          | hidden_messages            | user_id                   | users         | id                 | hidden_messages_user_id_fkey                    |
| public          | message_reads              | message_id                | messages      | id                 | message_reads_message_id_fkey                   |
| public          | message_reads              | user_id                   | users         | id                 | message_reads_user_id_fkey                      |
| public          | messages                   | conversation_id           | conversations | id                 | messages_conversation_id_fkey                   |
| public          | messages                   | deleted_by                | users         | id                 | messages_deleted_by_fkey                        |
| public          | messages                   | forwarded_from_message_id | messages      | id                 | messages_forwarded_from_message_id_fkey         |
| public          | messages                   | reply_to                  | messages      | id                 | messages_reply_to_fkey                          |
| public          | messages                   | sender_id                 | users         | id                 | messages_sender_id_fkey                         |
| public          | push_tokens                | user_id                   | users         | id                 | push_tokens_user_id_fkey                        |
| public          | user_conversation_settings | conversation_id           | conversations | id                 | user_conversation_settings_conversation_id_fkey |
| public          | user_conversation_settings | user_id                   | users         | id                 | user_conversation_settings_user_id_fkey         |


