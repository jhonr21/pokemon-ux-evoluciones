import { html, LitElement } from 'lit-element';
import styles from './pokemon-ux-evoluciones.css'; // Asegúrate que esta ruta sea correcta
import { BbvaCoreHeading } from '@bbva-web-components/bbva-core-heading';
import '@bbva-web-components/bbva-web-button-default/bbva-web-button-default.js';


export class PokemonUxEvoluciones extends LitElement {
  static get properties() {
    return {
      pokemon: { type: Object },
      evolutions: { type: Array },
      error: { type: Boolean },
      errorMessage: { type: String },
      isLoading: { type: Boolean },
      title: { type: String }
    };
  }

  constructor() {
    super();
    this.pokemon = {};
    this.evolutions = [];
    this.error = false;
    this.isLoading = false;
    this.errorMessage = '';
    this.fetchPokemon();
    this.title = 'Título por Defecto';
  }

  async fetchPokemon() {
    this.isLoading = true;
    try {
      const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/1`);
      if (!pokemonResponse.ok) throw new Error('Error al cargar el Pokémon');
      const pokemonData = await pokemonResponse.json();
      this.pokemon = {
        name: pokemonData.name,
        id: pokemonData.id,
        type: pokemonData.types.map(t => t.type.name).join(', '),
        sprites: pokemonData.sprites
      };

      // Obtener evoluciones
      await this.fetchEvolutions(pokemonData.species.url);
    } catch (error) {
      console.error('Error fetching Pokémon:', error);
      this.errorMessage = error.message;
      this.error = true;
    } finally {
      this.isLoading = false;
    }
  }

  async fetchEvolutions(speciesUrl) {
    try {
      const speciesResponse = await fetch(speciesUrl);
      const speciesData = await speciesResponse.json();
      const evolutionChainResponse = await fetch(speciesData.evolution_chain.url);
      const evolutionChainData = await evolutionChainResponse.json();

      const evolutionNames = this._extractEvolutions(evolutionChainData.chain);
      const evolutionDetails = await Promise.all(
        evolutionNames.map(name => this._fetchPokemonDetails(name))
      );

      this.evolutions = evolutionDetails.filter(evo => evo.name !== this.pokemon.name);
    } catch (error) {
      console.error('Error fetching evolutions:', error);
      this.errorMessage = 'Error al cargar las evoluciones';
      this.error = true;
    }
  }

  _extractEvolutions(chain) {
    const evolutions = [];
    let currentChain = chain;

    while (currentChain) {
      evolutions.push(currentChain.species.name);
      currentChain = currentChain.evolves_to[0];
    }

    return evolutions;
  }

  async _fetchPokemonDetails(pokemonName) {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching Pokémon details:', error);
      return null;
    }
  }

  static get styles() {
    return styles; // Asegúrate de que los estilos estén definidos correctamente
  }

  render() {
    return html`
<bbva-core-heading class="header">
  <figure>
    <svg
      viewBox="0 0 260 260"
      preserveAspectRatio="xMidYMid meet"
      focusable="false"
      style="
        pointer-events: none;
        display: block;
        width: 100%;
        height: 100%;
        overflow: hidden;
      "
    >
      <path
        class="st0"
        d="M130 10C63.7 10 10 63.7 10 130s53.7 120 120 120 120-53.7 120-120S196.3 10 130 10zm50 130.5h-40.5v50h-20v-50h-50v-20h50v-50h20v50H200l-20 20z"
      ></path>
    </svg>
  </figure>
  <h1>El pokemon seleccionado </h1>
  <bbva-web-button-default>Volver a la lista</<bbva-web-button-default>
</bbva-core-heading>


      <div class="pokemon-container">
        ${this.isLoading
          ? html`<p>Cargando Pokémon...</p>`
          : this.error
          ? html`<div class="error-message"><p>${this.errorMessage || 'Ha ocurrido un error.'}</p></div>`
          : html`
              <div class="pokemon-card">
                <h1>${this.pokemon.name}</h1>
                <img src="${this.pokemon.sprites?.other?.dream_world?.front_default || 'default-image-url'}" alt="${this.pokemon.name}">
                <p>Tipos: ${this.pokemon.type}</p>
              </div>
            `}
      </div>

      <div class="evolutions-container">
        <h2>Evoluciones</h2>
        <div class="evolutions-list">
          ${this.evolutions.map(evo => html`
            <div class="evolution-card">
              <h3>${evo.name}</h3>
              <img src="${evo.sprites?.other?.dream_world?.front_default || 'default-image-url'}" alt="${evo.name}">
              <p>Tipos: ${evo.types.map(t => t.type.name).join(', ')}</p>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}

