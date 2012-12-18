# Spatial search - reflexion on possible implementation

## JavaScript
 lookup city and initial geolocalization with api call supported by geokit or rely on third party

## Rails
the big part in this requirement is the filter. Thinking a the specification I would use a decorator pattern
each filter would have a score method.

 so the architecture of this component could be
``` ruby
 module Decorator
  def initialize(decorated)
    @decorated = decorated
  end

  def method_missing(method, *args)
    args.empty? ? @decorated.send(method) : @decorated.send(method, args)
  end
end

class LocationFilter
  include Decorator

  def score
    @decorated.score + compute_score (args)
  end

  private compute_score
  # here comes the specific implementation
end
```

the controller call location object with params (filters)

in location class:
 (I'm assuming that there is a radius around the desired location)
  * locations get retrieved
  *  score get calculated for each location with any filters - calculation get counpounded by each fitler 
  *  location sorted by score
  *  location returned either in json format to be consummed by a backbone.js/moustache or by plain html
