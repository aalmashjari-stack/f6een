-- صورةٌ مع الإجابة لأسئلة فئتي «بنات» (١٩ سبتمبر ٢٠٢٦) — بمفاتيح مشحونة في assets/pics.
-- لا يُكتب فوق صورةٍ قائمة؛ وupdated_at تُرفع لتتغيّر bank_signature.
update public.question_overrides o
   set answer_image = v.key, updated_at = now()
  from (values
  ('ADM6399', 'pic-face-huda-kattan'),
  ('ADM6400', 'pic-face-rihanna'),
  ('ADM6401', 'pic-beauty-argan'),
  ('ADM6412', 'pic-beauty-ruby-woo'),
  ('ADM6413', 'pic-place-grasse'),
  ('ADM6415', 'pic-beauty-amouage'),
  ('ADM6416', 'pic-beauty-kayali'),
  ('ADM6419', 'pic-beauty-bioderma'),
  ('ADM6420', 'pic-beauty-cosrx'),
  ('ADM6421', 'pic-beauty-sidr'),
  ('ADM6428', 'pic-beauty-kilian'),
  ('ADM6429', 'pic-beauty-agarwood'),
  ('ADM6434', 'pic-face-marilyn-monroe'),
  ('ADM6437', 'pic-beauty-kiehls'),
  ('ADM6440', 'pic-beauty-ithmid'),
  ('ADM6441', 'pic-beauty-hoola'),
  ('ADM6316', 'pic-fashion-stiletto'),
  ('ADM6317', 'pic-fashion-beret'),
  ('ADM6318', 'pic-face-elie-saab'),
  ('ADM6319', 'pic-fashion-vogue'),
  ('ADM6320', 'pic-fashion-devil-wears-prada'),
  ('ADM6321', 'pic-fashion-stan-smith'),
  ('ADM6335', 'pic-fashion-kelly-bag'),
  ('ADM6336', 'pic-fashion-audrey-lbd'),
  ('ADM6337', 'pic-fashion-met-gala'),
  ('ADM6338', 'pic-fashion-prada'),
  ('ADM6339', 'pic-face-gigi-hadid'),
  ('ADM6341', 'pic-fashion-tweed'),
  ('ADM6354', 'pic-fashion-kate-wedding'),
  ('ADM6355', 'pic-face-christian-dior'),
  ('ADM6356', 'pic-fashion-revenge-dress'),
  ('ADM6359', 'pic-fashion-missoni'),
  ('ADM6360', 'pic-fashion-off-white'),
  ('ADM6361', 'pic-fashion-le-smoking')
  ) as v(id, key)
 where o.question_id = v.id and o.answer_image is null;
