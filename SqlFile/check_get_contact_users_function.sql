-- This query checks for the existence and signature of the 'get_contact_users' function.

SELECT
    proname,
    proargnames,
    proargtypes::regtype[] AS arg_types,
    prorettype::regtype AS return_type
FROM
    pg_proc
WHERE
    proname = 'get_contact_users' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
