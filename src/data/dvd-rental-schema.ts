const DVD_RENTAL_SCHEMA = `
actor,"(
  actor_id integer PRIMARY KEY,
  first_name character varying,
  last_name character varying,
  last_update timestamp without time zone,
)"
address,"(
  address_id integer PRIMARY KEY,
  address character varying,
  address2 character varying,
  district character varying,
  city_id smallint REFERENCES city(city_id),
  postal_code character varying,
  phone character varying,
  last_update timestamp without time zone,
)"
category,"(
  category_id integer PRIMARY KEY,
  name character varying,
  last_update timestamp without time zone,
)"
city,"(
  city_id integer PRIMARY KEY,
  city character varying,
  country_id smallint REFERENCES country(country_id),
  last_update timestamp without time zone,
)"
country,"(
  country_id integer PRIMARY KEY,
  country character varying,
  last_update timestamp without time zone,
)"
customer,"(
  customer_id integer PRIMARY KEY,
  store_id smallint,
  first_name character varying,
  last_name character varying,
  email character varying,
  address_id smallint REFERENCES address(address_id),
  activebool boolean,
  create_date date,
  last_update timestamp without time zone,
  active integer,
)"
film,"(
  film_id integer PRIMARY KEY,
  title character varying,
  description text,
  release_year integer,
  language_id smallint REFERENCES language(language_id),
  rental_duration smallint,
  rental_rate numeric,
  length smallint,
  replacement_cost numeric,
  rating USER-DEFINED,
  last_update timestamp without time zone,
  special_features ARRAY,
  fulltext tsvector,
)"
film_actor,"(
  actor_id smallint REFERENCES actor(actor_id),
  actor_id smallint PRIMARY KEY,
  film_id smallint REFERENCES film(film_id),
  film_id smallint PRIMARY KEY,
  last_update timestamp without time zone,
)"
film_category,"(
  film_id smallint REFERENCES film(film_id),
  film_id smallint PRIMARY KEY,
  category_id smallint PRIMARY KEY,
  category_id smallint REFERENCES category(category_id),
  last_update timestamp without time zone,
)"
inventory,"(
  inventory_id integer PRIMARY KEY,
  film_id smallint REFERENCES film(film_id),
  store_id smallint,
  last_update timestamp without time zone,
)"
language,"(
  language_id integer PRIMARY KEY,
  name character,
  last_update timestamp without time zone,
)"
payment,"(
  payment_id integer PRIMARY KEY,
  customer_id smallint REFERENCES customer(customer_id),
  staff_id smallint REFERENCES staff(staff_id),
  rental_id integer REFERENCES rental(rental_id),
  amount numeric,
  payment_date timestamp without time zone,
)"
rental,"(
  rental_id integer PRIMARY KEY,
  rental_date timestamp without time zone,
  inventory_id integer REFERENCES inventory(inventory_id),
  customer_id smallint REFERENCES customer(customer_id),
  return_date timestamp without time zone,
  staff_id smallint REFERENCES staff(staff_id),
  last_update timestamp without time zone,
)"
staff,"(
  staff_id integer PRIMARY KEY,
  first_name character varying,
  last_name character varying,
  address_id smallint REFERENCES address(address_id),
  email character varying,
  store_id smallint,
  active boolean,
  username character varying,
  password character varying,
  last_update timestamp without time zone,
  picture bytea,
)"
store,"(
  store_id integer PRIMARY KEY,
  manager_staff_id smallint REFERENCES staff(staff_id),
  address_id smallint REFERENCES address(address_id),
  last_update timestamp without time zone,
)"
`

export default DVD_RENTAL_SCHEMA;