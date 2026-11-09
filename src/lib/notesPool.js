// notesPool.js — the complete love-note notebook.
// Every note is written by hand for Gelo to Precious (no AI, no API calls).
// The app picks a random note that has NOT been shown yet — see notesHistory.js.

export const WHO = { him: 'Gelo', her: 'Precious' }

// key: 'ask' (the big question), 'yes' (she said yes), 'itsADate' (locked in),
// 'afterDate' (a memory from a past date), 'memory' (after saving a photo).
// Every note is kept short and quirky — the pool size here is what makes
// repeats practically impossible.

export const NOTES = {
  ask: [
    `precious will you go out with me?
i have been thinking about this
for so long that my thumbs hurt
from typing and retyping it ♥`,
    `i have a question for you
and it is a small one
will you go out with me
pretty please ♥`,
    `two sentences is all i need
precious will you go out with me
i promise to make you smile
every single day ♥`,
    `dear precious
this is not a drill
i really want to go out with you
say yes already ♥`,
    `i looked at the sky this morning
and it whispered your name
so here i am asking
will you go out with me ♥`,
    `no long speech this time
just one question
will you go out with me
i will be a very good date ♥`,
    `precious i rehearsed this question
in the mirror seven times
will you go out with me
please say yes ♥`,
    `they say happiness is free
but mine costs one yes
will you go out with me
best investment ever ♥`,
    `here is my whole heart
in one tiny question
will you go out with me
it already chose you ♥`,
    `i do not need a fancy script
just your smile
will you go out with me
say yes and make my day ♥`,
    `warning: asking this question
may cause sudden happiness
will you go out with me
i am ready for the yes ♥`,
    `precious you are my favorite
notification every single day
will you go out with me
and be my favorite date too ♥`,
    `i saved this question for you
and nobody else gets it
will you go out with me
you are the one ♥`,
    `life is short and sweet
so let us make it sweeter
will you go out with me
i brought my whole heart ♥`,
    `a small question with big feelings
will you go out with me
because every day without you
is a day waiting for you ♥`,
    `precious i hope you say yes
the stars already wrote it down
will you go out with me
they are rooting for us ♥`,
    `i was not going to ask today
then i saw your name light up
will you go out with me
my heart voted yes ♥`,
    `this is me being brave
in the simplest way possible
will you go out with me
i kinda adore you ♥`,
    `two hearts one question
will you go out with me
mine is already beating for you
so just say yes ♥`,
    `precious i made a list of reasons
the list is very long
number one is you
will you go out with me ♥`,
  ],

  yes: [
    `yay precious said yes
you just made my whole week
i cannot stop smiling at my screen
right now ♥`,
    `she said yes she said yes
i am doing a little happy dance
in my room right now
thank you precious ♥`,
    `my heart is doing backflips
precious just said yes to me
this is the best day ever
i am never coming down ♥`,
    `yes yes yes yes yes
okay i am calm now
not really i am screaming
i love that you said yes ♥`,
    `precious you just turned my
ordinary day into a celebration
i will remember this yes forever
you are the best ♥`,
    `the world just got a little brighter
because precious said yes
my heart is so full right now
thank you my love ♥`,
    `i never thought a single word
would make me this happy
but here we are precious
thank you for saying yes ♥`,
    `my phone feels warmer already
because you said yes to me
precious you make me so happy
i am floating right now ♥`,
    `the rumors are true
precious is officially mine
and i could not be happier
best yes ever ♥`,
    `i have been smiling for five minutes
straight since you said yes
precious you are my favorite person
and now my favorite date ♥`,
    `one little yes from you
and my whole plan for the day
just became a celebration
i love you precious ♥`,
    `precious you make my chest feel warm
your yes is my favorite sound
i want to hear it every day
for the rest of our lives ♥`,
    `the butterflies are at war now
because precious said yes
and i am winning
happiness is mine today ♥`,
    `my hands are shaking a little
because this yes feels so big
thank you precious for choosing me
i will never take it for granted ♥`,
    `this yes just made history
in the small world of my heart
thank you precious
you are everything i wanted ♥`,
    `precious you said the sweetest word
and my day is now perfect
i cannot wait to see you
and hold your hand real soon ♥`,
    `the sky cleared up just now
because precious said yes
it is a good omen i swear
we are going to be great ♥`,
    `my heart found its favorite word
and it is yes from you
precious i adore you so much
thank you for today ♥`,
    `i am going to tell everyone
my girlfriend said yes
well soon she will be
and i am already proud ♥`,
    `precious your yes feels like home
like the place my heart was always
trying to find
i am so lucky to have you ♥`,
  ],

  itsADate: [
    `IT'S A DATE
this is officially us now
locked in no take-backs
i already cleared my calendar
for you precious ♥`,
    `it is official precious
you and me it is a date
i already picked my best outfit
and practiced my smile ♥`,
    `we did it love
it is a date yes it is
and i have not stopped smiling
since you said yes ♥`,
    `this date is locked in
with a tiny bow on it
precious you are my favorite plan
and my favorite person ♥`,
    `calendar marked
heart marked
precious marked as mine-ish
it is a date and i am excited ♥`,
    `i just saved our date
and i cannot believe it is real
precious you said yes to me
and now it is official ♥`,
    `no more asking no more guessing
it is a date precious
i am counting down the days
until i see you ♥`,
    `it is a date and i feel lucky
because i get to spend time
with the prettiest girl
i know precious ♥`,
    `our date is saved and sealed
with a kiss on top
i am bringing my whole heart
and an extra smile ♥`,
    `precious this is us now
a date on the books
and a lifetime of smiles ahead
i am so grateful for you ♥`,
    `it is a date precious
and i already told the calendar
about my favorite person
you are that person ♥`,
    `locked in locked in locked in
it is a date my love
i will bring the jokes
and the butterflies ♥`,
    `you said yes and i said wow
now it is a date precious
i cannot wait to make you laugh
and hold your hand ♥`,
    `our date is now a real thing
saved in the sky and in my heart
precious i am the happiest guy
on this whole planet ♥`,
    `it is a date and i am glowing
because precious chose me
i will make sure it is worth it
every second of it ♥`,
    `officially an us-date now
precious you just made my year
i am bringing flowers and snacks
and my best self ♥`,
    `we are a date now precious
and i feel like the luckiest guy
your smile is my favorite plan
i am so ready for this ♥`,
    `it is a date and i wrote it down
in my heart in big letters
precious you are my number one
and always will be ♥`,
    `locked in with love precious
our date is the start of many
i cannot wait for the adventures
and the little moments ♥`,
    `it is a date my love
and my heart is doing a parade
because precious said yes
and now i get your time ♥`,
  ],

  afterDate: [
    `thank you for today precious
every second felt like a little
adventure i never want to end
i am still smiling about it ♥`,
    `i keep replaying today in my head
precious you made it perfect
thank you for being you
and for being with me ♥`,
    `my favorite part of today
was watching you laugh
precious you are pure happiness
and i am so lucky ♥`,
    `today felt like a dream
and you were the best part
thank you for the memories
i will treasure them all ♥`,
    `i knew today would be good
but i did not know it would
be this good precious
you are amazing ♥`,
    `your smile today will live
in my head rent free forever
thank you for making
my day so special ♥`,
    `i did not want today to end
but i love knowing we have more
thank you for being my person
precious you are everything ♥`,
    `today proved what i always knew
that you are the best part
of my every day precious
thank you my love ♥`,
    `my camera roll is full of you now
and my heart is even fuller
thank you for today precious
let us do it again soon ♥`,
    `i loved every minute with you
even the quiet ones
precious you make silence feel warm
thank you for today ♥`,
    `walking beside you today
felt like the easiest yes ever
thank you precious for the date
and for your sweet smile ♥`,
    `today was not just a date
it was a preview of forever
thank you precious
i adore every part of you ♥`,
    `i am still on cloud nine
precious you put me there
thank you for a perfect day
and for choosing me ♥`,
    `the best part of today
was you saying i had a good time
precious you made my whole year
i love you endlessly ♥`,
    `i would relive today a thousand times
just to see your smile again
thank you my love
precious you are my heart ♥`,
    `your laugh today is my new
favorite sound in the world
thank you precious for today
and for being you ♥`,
    `today felt like a warm hug
from the universe itself
thank you precious for the date
you are so special to me ♥`,
    `i knew you were special
but today made it official
thank you precious for everything
i am never letting you go ♥`,
    `every moment with you is magic
today was no exception
thank you precious for today
you make my heart sing ♥`,
    `i love how safe i feel with you
today was perfect because of you
thank you my precious girl
for being my favorite ♥`,
  ],

  memory: [
    `this photo is my new
favorite thing in the world
because you are in it precious
and so is our memory ♥`,
    `i just saved us forever
in one little photo
this is us precious
this is our story ♥`,
    `my camera roll just got a
whole lot prettier precious
thank you for being in it
and for making today real ♥`,
    `look at us precious
we look like a story
and i want to keep writing it
forever with you ♥`,
    `this photo proves it
today really happened
precious you and me
and a beautiful memory ♥`,
    `i will keep this photo close
like i keep you close
precious this is us
and i love this so much ♥`,
    `our memory is safe now
locked in this little photo
precious you are beautiful
and today was perfect ♥`,
    `every time i see this photo
i will remember your smile
and how happy you made me
thank you my love ♥`,
    `precious this is the start
of a thousand more photos
with you in every one
i am so grateful ♥`,
    `this photo is proof
that you are my favorite
part of every day
thank you precious for today ♥`,
    `i saved a piece of today
in this photo precious
and i will treasure it
along with you forever ♥`,
    `look precious we did it
we made a memory together
and it is the prettiest one
i have ever seen ♥`,
    `this is us laughing
and i never want to stop
precious you make life sweet
thank you for this moment ♥`,
    `my heart stored this memory
the second you smiled
this photo is just the proof
precious i adore you ♥`,
    `today became a memory
and a beautiful one at that
precious you are magic
and i am so lucky ♥`,
    `we look so good together
precious this photo says it all
thank you for being mine-ish
and for today's smiles ♥`,
    `i will show this photo to everyone
and tell them about today
precious you stole my heart
and i let you ♥`,
    `this moment is ours forever
saved in a photo and in my heart
precious thank you for today
you are my everything ♥`,
    `every photo of you
makes my day better
but this one with us
is my favorite ever ♥`,
    `precious this is our story
in one frame
and i cannot wait for
the next chapter with you ♥`,
  ],
}
