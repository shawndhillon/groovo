Login Improvements -

Updated the authentication logic so that manual login consistently works, even when the session object does not contain the expected user ID format.

Added a helper function for fallback that derives the user ID from either session.user.id or session.user.email. Fixed routes that previously returned 401 Unauthorized even when the user was logged in. 


Completed the full Library Functionality (Save & Delete) -

The album library feature has been expanded to fully support saving and removing albums.


Implemented a GET route to save albums to a user's library.
Ensures a consistent pattern for fetching/saving album data tied to the logged in user.
Added a DELETE endpoint that removes a saved album from the user's library.
users can remove previously saved albums. The UI and the database are in sync


SPRINT 4 USER STORY 4: “Recommended For You” (Backlogged)

Meant to have a "Recommended For You" section to recommend albums to logged in users.

Built a foundation for an album recommendation system, but the full feature will not be completed before the project deadline. Created A group of functions analyzing user listening history (saved albums + reviews). It builds a profile based on a user's taste. I used Spotify's recommendation and related artists for this, but Spotify’s Recommendations and Related Artists endpoints returned inconsistent 404 errors in our testing environment. After the quarter maybe we can still work on it.