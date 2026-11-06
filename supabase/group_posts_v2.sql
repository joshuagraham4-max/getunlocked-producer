-- Group post bank v2 (Nov 6, 2026): a sequence per group.
--   hook    -> curiosity + self-interest, open-ended, gets hand-raisers
--   qualify -> "if you're this or this..." call-outs, hand-raise in comments
--   presell -> proof and education (real stories, math, myth-busters)
--   offer   -> soft offer with {SIGN} (phone + NMLS), only in groups that allow promo
-- The app runs each group through: hook, qualify, presell, presell, offer (presell where promo isn't allowed).
-- Old ad-style posts are paused (active = false), not deleted.
update public.group_posts set active = false where user_id = 'f43a0121-3b76-4d1e-92b5-73e685b81c52';

insert into public.group_posts (user_id, title, kind, image, active, sort, body) values
-- HOOKS
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Hook: $100K dead equity poll','hook',null,true,100,
$p$Quick poll for the landlords here: if you had $100K of equity sitting in a paid-off rental, would you leave it there or pull it out to buy the next one? Curious what's driving people's decisions right now.$p$),
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Hook: bridge exit plan','hook',null,true,101,
$p$For anyone on a hard money or bridge loan right now: what's the plan when it comes due? Sell, refi, or extend? Curious how people are playing it this year.$p$),
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Hook: what is stopping you','hook',null,true,102,
$p$Landlords: what's the one thing stopping you from buying another rental right now? Down payment, the numbers, finding the deal, or something else? Genuinely curious where everyone's at.$p$),
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Hook: no tax return cash-out','hook',null,true,103,
$p$Question for the landlords: if you could pull cash out of a rental without showing a single tax return, would you do it? Or does that sound too good to be true? Curious where people land on this.$p$),
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Hook: cash buyers','hook',null,true,104,
$p$Anyone here buy a property with cash in the last year and wish they hadn't tied it all up? If you could get most of it back out, what would you do with it?$p$),
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Hook: when did you go LLC','hook',null,true,105,
$p$For the folks with a few doors: how many properties did you own before you switched to LLCs or portfolio-style loans? Curious when people made the jump and what pushed them.$p$),
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Hook: Airbnb income ignored','hook',null,true,106,
$p$Airbnb and short-term rental owners: has a lender ever ignored your rental income because it didn't show up on your tax returns the way they wanted? Curious how common this is.$p$),

-- QUALIFY
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Qualify: 2+ rentals with equity','qualify',null,true,110,
$p$If you own two or more rentals with real equity in them, quick question: is that equity actually doing anything for you right now?

Comment below. Happy to share what other landlords here are doing with theirs.$p$),
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Qualify: bridge due in 6 months','qualify',null,true,111,
$p$If you're on a bridge or hard money loan that comes due in the next six months, and your exit isn't locked in yet, drop a comment.

There's usually a cleaner way out than another extension, and I'm glad to walk you through it.$p$),
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Qualify: self-employed write-offs','qualify',null,true,112,
$p$If you're self-employed, write off everything you can, and the bank keeps telling you your income doesn't qualify for the next rental, comment "rent."

The property can often qualify itself.$p$),
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Qualify: rehab sitting unrented','qualify',null,true,113,
$p$If you just finished a rehab and it's sitting unrented while the short-term loan clock keeps running, this one's for you.

Comment and I'll explain how some lenders use market rent instead of a signed lease.$p$),

-- PRESELL
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Presell: tax return myth','presell',null,true,120,
$p$Something I wish more investors knew before their third property:

You don't always need tax returns to refinance a rental.

On a lot of investor loans the rent qualifies the loan. If the property covers its own payment, your W-2 and your Schedule E mostly don't come into it.

Most people find this out after they've already been turned down once.$p$),
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Presell: 12-day cash-out story','presell',null,true,121,
$p$Investor wanted to pull cash out of a rental.

No tax returns. No pay stubs. Nobody digging through his business.

Appraisal plus the lease, and the rent qualified the loan. Closed in twelve days with about $70,000 back in his pocket.

The part that surprised him most: nobody asked about his personal income once.$p$),
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Presell: 15% down math','presell',null,true,122,
$p$How the math works on a $350K rental with 15% down:

About $52,500 down
About $10,500 in closing costs
Roughly $63,000 in to close

A lot of landlords have that sitting in a property they already own. Pull it out of one, and it buys the next one without touching your savings.$p$),
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Presell: extension math','presell',null,true,123,
$p$Bridge loan extension math, for anyone sitting on one:

One point to extend three months on a $300K note is $3,000. Plus three more months of the higher payment.

Two extensions in and you've often spent more than the closing costs on a long-term loan would have been.

Run the numbers before you sign the next one.$p$),
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Presell: not rented yet','presell',null,true,124,
$p$Just finished a rehab and it's not rented yet?

Some long-term investor loans can use market rent from the appraisal instead of a signed lease.

Worth knowing before you pay for another extension on the short-term loan.$p$),
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Presell: Airbnb projected income','presell',null,true,125,
$p$Short-term rental owners:

Some investor loans can use projected Airbnb income to qualify, even before the property has a rental history.

Most people assume they need a year or two of tax returns showing the income first. Not always the case.$p$),
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Presell: LLC tip','presell',null,true,126,
$p$Common question: can I close my rental loan in my LLC?

On investor loans, yes. That's normal.

The mistake I see is buying in your personal name and deeding it to the LLC later. That can create a headache with the lender. Easier to set it up right on the front end.$p$),
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Presell: reserves','presell',null,true,127,
$p$One vacancy shouldn't sink a portfolio.

The landlords I see sleeping best keep reserves outside the properties, not just equity inside them.

Pulling some equity out while things are steady is one way to build that cushion. Harder to do after something changes.$p$),

-- OFFERS (only where group rules allow promo)
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Offer: run your numbers','offer',null,true,140,
$p$I'm a wholesale mortgage broker working with investors in Florida and Colorado.

If you're on a bridge loan coming due, or have equity stuck in a rental, happy to run your numbers. No strings.

Free rental calculator: {CALC}

{SIGN}$p$),
('f43a0121-3b76-4d1e-92b5-73e685b81c52','Offer: portfolio review','offer',null,true,141,
$p$Free portfolio review for landlords: what you own, where your equity is stuck, and what it could buy next.

Takes about two minutes: approvedbyjoshua.com/review

{SIGN}$p$);
