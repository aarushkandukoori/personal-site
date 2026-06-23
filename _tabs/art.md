---
icon: fas fa-palette
order: 3
---

Paintings and sketches.

<div class="art-gallery" markdown="0">
{% for i in (1..31) %}
  {% assign num = i | prepend: '00' | slice: -2, 2 %}
  {% capture art_path %}/assets/img/art/art-{{ num }}.png{% endcapture %}
  <img src="{% include asset-url.html path=art_path %}" alt="Painting {{ i }}" loading="lazy" />
{% endfor %}
</div>
