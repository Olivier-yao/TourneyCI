insert into jeux (id, label, genre) values
  ('eafc','EA FC','Sport'),
  ('freefire','Free Fire','Battle Royale'),
  ('codm','CODM','FPS'),
  ('tekken','Tekken','Combat'),
  ('pubgm','PUBG Mobile','Battle Royale'),
  ('mlbb','Mobile Legends','TPS'),
  ('bloodstrike','Bloodstrike','Battle Royale'),
  ('farlight84','Farlight 84','Battle Royale'),
  ('valorant','Valorant','FPS'),
  ('wildrift','LoL: Wild Rift','TPS'),
  ('fortnite','Fortnite','Battle Royale'),
  ('brawlstars','Brawl Stars','TPS'),
  ('clashroyale','Clash Royale','Combat'),
  ('efootball','eFootball','Sport'),
  ('nba2k','NBA 2K','Sport'),
  ('standoff2','Standoff 2','FPS'),
  ('criticalops','Critical Ops','FPS'),
  ('aov','Arena of Valor','TPS'),
  ('marvelsuperwar','Marvel Super War','TPS'),
  ('mortalkombat','Mortal Kombat','Combat'),
  ('shadowfight3','Shadow Fight 3','Combat'),
  ('streetfighter','Street Fighter Duel','Combat'),
  ('basketballstars','Basketball Stars','Sport'),
  ('headsoccer','Head Soccer','Sport'),
  ('newstate','New State Mobile','Battle Royale'),
  ('rulesofsurvival','Rules of Survival','Battle Royale');

insert into pays (id, nom) values
  ('ci', 'Côte d''Ivoire'),
  ('sn', 'Sénégal'),
  ('ml', 'Mali'),
  ('bf', 'Burkina Faso'),
  ('gh', 'Ghana'),
  ('tg', 'Togo'),
  ('bj', 'Bénin'),
  ('ng', 'Nigéria'),
  ('cm', 'Cameroun'),
  ('cd', 'RD Congo'),
  ('ke', 'Kenya');

insert into villes (pays_id, nom) values
  ('ci','Abengourou'), ('ci','Abidjan'), ('ci','Bouaké'), ('ci','Daloa'), ('ci','Divo'),
  ('ci','Gagnoa'), ('ci','Korhogo'), ('ci','Man'), ('ci','San-Pédro'), ('ci','Yamoussoukro'),
  ('sn','Dakar'), ('sn','Kaolack'), ('sn','Mbour'), ('sn','Saint-Louis'), ('sn','Thiès'), ('sn','Touba'), ('sn','Ziguinchor'),
  ('ml','Bamako'), ('ml','Kayes'), ('ml','Mopti'), ('ml','Ségou'), ('ml','Sikasso'),
  ('bf','Bobo-Dioulasso'), ('bf','Koudougou'), ('bf','Ouagadougou'),
  ('gh','Accra'), ('gh','Cape Coast'), ('gh','Kumasi'), ('gh','Takoradi'), ('gh','Tamale'),
  ('tg','Kara'), ('tg','Lomé'), ('tg','Sokodé'),
  ('bj','Cotonou'), ('bj','Parakou'), ('bj','Porto-Novo'),
  ('ng','Abuja'), ('ng','Benin City'), ('ng','Ibadan'), ('ng','Kano'), ('ng','Lagos'), ('ng','Port Harcourt'),
  ('cm','Bafoussam'), ('cm','Douala'), ('cm','Garoua'), ('cm','Yaoundé'),
  ('cd','Goma'), ('cd','Kinshasa'), ('cd','Lubumbashi'), ('cd','Mbuji-Mayi'),
  ('ke','Kisumu'), ('ke','Mombasa'), ('ke','Nairobi'), ('ke','Nakuru');

insert into villes (pays_id, nom, commune_de)
  select 'ci', commune, (select id from villes where nom = 'Abidjan' and pays_id = 'ci')
  from unnest(array[
    'Abobo','Adjamé','Anyama','Attécoubé','Bingerville','Cocody',
    'Koumassi','Marcory','Plateau','Port-Bouët','Songon','Treichville','Yopougon'
  ]) as commune;
