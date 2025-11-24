// scripts/fetchBillboardTopAlbums.js
import 'dotenv/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import SpotifyWebApi from 'spotify-web-api-node';

console.log("CLIENT ID:", process.env.SPOTIFY_CLIENT_ID);
console.log("CLIENT SECRET:", process.env.SPOTIFY_CLIENT_SECRET ? "LOADED" : "MISSING");


const BILLBOARD_URL = 'https://www.billboard.com/charts/billboard-200/';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

function normalizeName(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/feat\..*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Try to match a Billboard album to a Spotify album.
 * @param {object} album - { title, artist }
 * @returns {Promise<{spotifyAlbumId: string, spotifyUrl: string|null, imageUrl: string|null} | null>}
 */
async function matchBillboardAlbumToSpotify(album) {
  // Build search query: "album title artist name"
  const query = `${album.title} ${album.artist}`;

  // Search Spotify albums (limit a few results)
  const resp = await spotifyApi.searchAlbums(query, { limit: 5 });
  const items = resp.body.albums?.items ?? [];
  if (!items.length) return null;

  const targetArtist = normalizeName(album.artist);

  // Try to find the closest artist name match
  const best =
    items.find(spAlbum => {
      const artistNames = (spAlbum.artists || []).map(a =>
        normalizeName(a.name),
      );
      return artistNames.some(
        name =>
          name.includes(targetArtist) || targetArtist.includes(name),
      );
    }) || items[0]; // fallback: first result

  return {
    spotifyAlbumId: best.id,
    spotifyUrl: best.external_urls?.spotify ?? null,
    imageUrl: best.images?.[0]?.url ?? null, // usually largest image
  };
}


async function fetchBillboardTopAlbums() {
  try {
    console.log('Fetching Billboard 200 page...');
    const resp = await axios.get(BILLBOARD_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (student project scraper)',
      },
    });

    const html = resp.data;
    const $ = cheerio.load(html);

    // 1) Get Spotify access token once per script run
    console.log('Requesting Spotify access token...');
    const tokenData = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(tokenData.body.access_token);

    // 2) Scrape Billboard rows
    const rowContainers = $('div.o-chart-results-list-row-container').toArray();

    const albums = [];

    for (const row of rowContainers) {
      if (albums.length >= 5) break; // we only want top 5 valid rows

      const title = $(row)
        .find('h3#title-of-a-story')
        .first()
        .text()
        .trim();

      const artist = $(row)
        .find('span.c-label.a-no-trucate a')
        .first()
        .text()
        .trim();

      if (!title || !artist) continue;

      // 3) Match this Billboard album to Spotify
      const match = await matchBillboardAlbumToSpotify({ title, artist });

      albums.push({
        position: albums.length + 1, // 1..5 based on valid rows
        title,
        artist,
        spotifyAlbumId: match?.spotifyAlbumId ?? null,
        spotifyUrl: match?.spotifyUrl ?? null,
        imageUrl: match?.imageUrl ?? null,
      });
    }

    // 4) Print enriched JSON
    console.log(JSON.stringify(albums, null, 2));
  } catch (err) {
    console.error('Failed to scrape Billboard 200:', err?.message || err);
    process.exit(1);
  }
}

fetchBillboardTopAlbums();
