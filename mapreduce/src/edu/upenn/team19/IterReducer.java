package edu.upenn.team19;
import java.io.IOException;
import java.util.Hashtable;

import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.Reducer.Context;

public class IterReducer extends Reducer<Text, Text, Text, Text>{
	public void reduce(Text key, Iterable<Text> values, Context context) throws IOException, InterruptedException{
		String edges = "";
		Hashtable<String, Double> ranks = new Hashtable<String, Double>();
		
		for (Text value : values){
			if (value.toString().startsWith("*")){
				// this value stores the previous edge information.
				edges = value.toString().substring(1);
			} else {
				String[] info = value.toString().split(",");
				String fromuser = info[0];
				double rank = Double.parseDouble(info[1]);
				
				if (ranks.get(fromuser) != null){
					ranks.put(fromuser, ranks.get(fromuser) + rank);
				} else {
					ranks.put(fromuser, new Double(rank));
				}
			}
		}
		String totalranks = "";
		for (String name : ranks.keySet()){
			double finalrank = 0.15 + 0.85*ranks.get(name);
			totalranks = totalranks + finalrank + "," + name + ";";
		}
		context.write(new Text(key.toString()), new Text(edges + " " + totalranks));
	}
}