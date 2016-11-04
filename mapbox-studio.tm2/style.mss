@name: '[name_en]';

@land: #fafafa;
@water: #89b1d5;
@darkblue: #203049;
@lightgrey: #aeb2b5;

Map { background-color: @land; }

#admin[admin_level=2][maritime=0] {
  line-join: round;
  line-color: @lightgrey;
  line-width: 1.4;
}

#water {
  polygon-fill: @water;
  polygon-gamma: 1;
}

#hillshade {
  polygon-fill: #ececec;
}

#landcover {
  [class="wood"] {
    polygon-fill: #ececec;
   }
}