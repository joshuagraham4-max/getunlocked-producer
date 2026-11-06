-- Group post bank v2 (Nov 6, 2026): value-first. Old ad-style posts are paused (active = false), not deleted.
-- Value posts: no phone, no link, no image. Soft offers carry {SIGN} (phone + NMLS) and run only where group rules allow.
update public.group_posts set active = false where user_id = 'f43a0121-3b76-4d1e-92b5-73e685b81c52';

insert into public.group_posts (user_id, title, kind, image, active, sort, body) values
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Poll: dead equity','value',null,true,100,
$p$Quick poll for the landlords here.

If you had $100K of equity sitting in a paid-off rental, would you leave it there or pull it out to buy the next one?

Curious what's driving people's decisions right now.$p$),

('f43a0121-3b76-4d1e-92b5-73e685b81c52','Question: bridge exit plan','value',null,true,101,
$p$For anyone on a hard money or bridge loan right now: what's your exit plan when it comes due?

Sell, refinance, or extend?

Seeing a lot of investors pay for one extension, then a second, and the fees add up fast. Interested in how people here are handling it.$p$),

('f43a0121-3b76-4d1e-92b5-73e685b81c52','Myth: tax returns','value',null,true,102,
$p$Something I wish more investors knew before their third property:

You don't always need tax returns to refinance a rental.

On a lot of investor loans the rent qualifies the loan. If the property covers its own payment, your W-2 and your Schedule E mostly don't come into it.

Most people find this out after they've already been turned down once.$p$),

('f43a0121-3b76-4d1e-92b5-73e685b81c52','Story: 12-day cash-out','value',null,true,103,
$p$Investor wanted to pull cash out of a rental.

No tax returns. No pay stubs. Nobody digging through his business.

Appraisal plus the lease, and the rent qualified the loan. Closed in twelve days with about $70,000 back in his pocket.

The part that surprised him most: nobody asked about his personal income once.$p$),

('f43a0121-3b76-4d1e-92b5-73e685b81c52','Breakdown: 15% down on $350K','value',null,true,104,
$p$How the math works on a $350K rental with 15% down:

About $52,500 down
About $10,500 in closing costs
Roughly $63,000 in to close

A lot of landlords have that sitting in a property they already own. Pull it out of one, and it buys the next one without touching your savings.

Anyone here done it this way?$p$),

('f43a0121-3b76-4d1e-92b5-73e685b81c52','Question: what is stopping you','value',null,true,105,
$p$Landlords: what's the biggest thing stopping you from buying another one right now?

Cash for the down payment, the numbers not working, finding the deal, or something else?

Genuinely curious. The answers are different every time I ask.$p$),

('f43a0121-3b76-4d1e-92b5-73e685b81c52','Tip: closing in your LLC','value',null,true,106,
$p$Common question: can I close my rental loan in my LLC?

On investor loans, yes. That's normal.

The mistake I see is buying in your personal name and deeding it to the LLC later. That can create a headache with the lender. Easier to set it up right on the front end.$p$),

('f43a0121-3b76-4d1e-92b5-73e685b81c52','Tip: short-term rentals','value',null,true,107,
$p$Short-term rental owners:

Some investor loans can use projected Airbnb income to qualify, even before the property has a rental history.

Most people assume they need a year or two of tax returns showing the income first. Not always the case.$p$),

('f43a0121-3b76-4d1e-92b5-73e685b81c52','Tip: not rented yet','value',null,true,108,
$p$Just finished a rehab and it's not rented yet?

Some long-term investor loans can use market rent from the appraisal instead of a signed lease.

Worth knowing before you pay for another extension on the short-term loan.$p$),

('f43a0121-3b76-4d1e-92b5-73e685b81c52','Math: extension fees','value',null,true,109,
$p$Bridge loan extension math, for anyone sitting on one:

One point to extend three months on a $300K note is $3,000. Plus three more months of the higher payment.

Two extensions in and you've often spent more than the closing costs on a long-term loan would have been.

Run the numbers before you sign the next one.$p$),

('f43a0121-3b76-4d1e-92b5-73e685b81c52','Question: LLC or portfolio switch','value',null,true,110,
$p$For the folks with a few doors: how many properties did you own before you switched to LLCs or portfolio-style loans?

Trying to get a feel for when people here made the jump and what pushed them to do it.$p$),

('f43a0121-3b76-4d1e-92b5-73e685b81c52','Thought: reserves','value',null,true,111,
$p$One vacancy shouldn't sink a portfolio.

The landlords I see sleeping best keep reserves outside the properties, not just equity inside them.

Pulling some equity out while things are steady is one way to build that cushion. Harder to do after something changes.$p$),

('f43a0121-3b76-4d1e-92b5-73e685b81c52','Question: cash buyers refi','value',null,true,112,
$p$Anyone here buy with cash in the last six months and wish you hadn't tied it all up?

Some investor loans let you refinance a cash purchase fairly quickly and get most of that money back out. Curious how many people know that's an option.$p$),

('f43a0121-3b76-4d1e-92b5-73e685b81c52','Offer: bridge or stuck equity','offer',null,true,120,
$p$I'm a wholesale mortgage broker working with investors in Florida and Colorado.

If you're on a bridge loan coming due, or have equity stuck in a rental, happy to run your numbers. No strings.

Free rental calculator: {CALC}

{SIGN}$p$),

('f43a0121-3b76-4d1e-92b5-73e685b81c52','Offer: portfolio review','offer',null,true,121,
$p$Free portfolio review for landlords: what you own, where your equity is stuck, and what it could buy next.

Takes about two minutes: approvedbyjoshua.com/review

{SIGN}$p$);
