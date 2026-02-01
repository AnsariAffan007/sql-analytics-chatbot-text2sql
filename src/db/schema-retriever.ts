const SCHEMA_RETRIEVAL_QUERY = `
SELECT
	columns.table_name,
	'(' || E'\n' ||
	string_agg(
			'  ' || columns.column_name || ' ' || columns.data_type ||
			COALESCE(
					CASE 
							WHEN tc.constraint_type = 'PRIMARY KEY' THEN ' PRIMARY KEY'
							WHEN tc.constraint_type = 'UNIQUE' THEN ' UNIQUE'
							WHEN tc.constraint_type = 'FOREIGN KEY' THEN 
									' REFERENCES ' || referenced_kcu.table_name || '(' || referenced_kcu.column_name || ')'
					END,
					''
			)
			|| ',',
			E'\n'
			ORDER BY columns.ordinal_position
	)
	|| E'\n' || ')' AS table_definition
FROM information_schema.columns as columns
INNER JOIN information_schema.tables as tables 
	ON tables.table_name = columns.table_name
	AND tables.table_schema = columns.table_schema
LEFT JOIN information_schema.key_column_usage as kcu 
	ON kcu.table_name = columns.table_name
	AND kcu.column_name = columns.column_name
	AND kcu.table_schema = columns.table_schema
LEFT JOIN information_schema.table_constraints as tc 
	ON tc.constraint_name = kcu.constraint_name
	AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.referential_constraints as rc
	ON rc.constraint_name = kcu.constraint_name
	AND rc.constraint_schema = kcu.constraint_schema
LEFT JOIN information_schema.key_column_usage as referenced_kcu
	ON referenced_kcu.constraint_name = rc.unique_constraint_name
	AND referenced_kcu.constraint_schema = rc.unique_constraint_schema
WHERE columns.table_schema = 'public' AND tables.table_type = 'BASE TABLE'
GROUP BY columns.table_name;
`

export default SCHEMA_RETRIEVAL_QUERY;